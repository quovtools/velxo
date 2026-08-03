/**
 * Truncate all tables using raw PostgreSQL wire protocol with SCRAM-SHA-256
 */
const tls = require('tls')
const crypto = require('crypto')

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!connStr) { console.error('No DATABASE_URL set'); process.exit(1) }

const url = new URL(connStr)
const host = url.hostname
const port = parseInt(url.port || '5432')
const database = url.pathname.slice(1)
const user = url.username
const password = decodeURIComponent(url.password)

const tables = [
  'reward_redemptions','reward_coin_transactions','affiliate_referrals',
  'blog_posts','game_slides','commissions','withdrawal_requests','payments',
  'payment_methods','fraud_flags','admin_audit_logs','support_tickets',
  'dispute_messages','disputes','notifications','messages','conversations',
  'reviews','wallet_transactions','wallets','piyrox_coins','escrow_transactions',
  'order_items','orders','gigs','topup_products','marquee_items','listings',
  'seller_subscriptions','sellers','subcategories','categories','users','reward_catalog'
]

const truncateSQL = `TRUNCATE TABLE ${tables.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`

// ── Wire protocol helpers ─────────────────────────────────────────────────────

function buildStartupMessage(user, database) {
  const body = `user\0${user}\0database\0${database}\0\0`
  const len = 8 + Buffer.byteLength(body)
  const buf = Buffer.allocUnsafe(len)
  buf.writeUInt32BE(len, 0)
  buf.writeUInt32BE(196608, 4)
  buf.write(body, 8, 'utf8')
  return buf
}

function buildMsg(type, body) {
  const b = typeof body === 'string' ? Buffer.from(body, 'utf8') : body
  const buf = Buffer.allocUnsafe(1 + 4 + b.length)
  buf[0] = type.charCodeAt(0)
  buf.writeUInt32BE(4 + b.length, 1)
  b.copy(buf, 5)
  return buf
}

function buildSimpleQuery(sql) {
  return buildMsg('Q', sql + '\0')
}

function parseMessages(buf) {
  const messages = []
  let offset = 0
  while (offset + 5 <= buf.length) {
    const type = String.fromCharCode(buf[offset])
    const len = buf.readUInt32BE(offset + 1)
    if (offset + 1 + len > buf.length) break
    const body = buf.slice(offset + 5, offset + 1 + len)
    messages.push({ type, body })
    offset += 1 + len
  }
  return { messages, remaining: buf.slice(offset) }
}

function parseErrorBody(body) {
  let msg = '', detail = ''
  let i = 0
  while (i < body.length) {
    const field = String.fromCharCode(body[i++])
    let end = body.indexOf(0, i)
    if (end === -1) end = body.length
    const val = body.slice(i, end).toString()
    i = end + 1
    if (field === 'M') msg = val
    if (field === 'D') detail = val
    if (field === '\0') break
  }
  return detail ? `${msg} (${detail})` : msg
}

// ── SCRAM-SHA-256 ─────────────────────────────────────────────────────────────

function hi(password, salt, iterations) {
  return crypto.pbkdf2Sync(
    Buffer.from(password, 'utf8'),
    salt,
    iterations,
    32,
    'sha256'
  )
}

function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest()
}

function h(data) {
  return crypto.createHash('sha256').update(data).digest()
}

function xor(a, b) {
  const out = Buffer.allocUnsafe(a.length)
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i]
  return out
}

class ScramClient {
  constructor(password) {
    this.password = password
    this.clientNonce = crypto.randomBytes(18).toString('base64')
    this.clientFirstMessageBare = `n,,n=*,r=${this.clientNonce}`.slice(3) // without gs2-header
    this.gs2Header = 'n,,'
  }

  // Step 1: client-first-message
  clientFirst() {
    this.clientFirstMessage = this.gs2Header + `n=*,r=${this.clientNonce}`
    return this.clientFirstMessage
  }

  // Step 2: parse server-first, produce client-final
  clientFinal(serverFirst) {
    this.serverFirst = serverFirst
    const parts = {}
    for (const part of serverFirst.split(',')) {
      const eq = part.indexOf('=')
      parts[part.slice(0, eq)] = part.slice(eq + 1)
    }

    const r = parts['r']
    const s = parts['s']
    const i = parseInt(parts['i'], 10)

    if (!r.startsWith(this.clientNonce)) {
      throw new Error('SCRAM: server nonce does not match client nonce')
    }

    const salt = Buffer.from(s, 'base64')
    const saltedPassword = hi(this.password, salt, i)

    const clientKey = hmac(saltedPassword, 'Client Key')
    const storedKey = h(clientKey)

    const clientFinalMessageWithoutProof =
      `c=${Buffer.from(this.gs2Header).toString('base64')},r=${r}`

    const authMessage = [
      `n=*,r=${this.clientNonce}`,
      serverFirst,
      clientFinalMessageWithoutProof
    ].join(',')

    const clientSignature = hmac(storedKey, authMessage)
    const clientProof = xor(clientKey, clientSignature)

    // Save for verification
    const serverKey = hmac(saltedPassword, 'Server Key')
    this.serverSignature = hmac(serverKey, authMessage).toString('base64')

    return `${clientFinalMessageWithoutProof},p=${clientProof.toString('base64')}`
  }

  // Step 3: verify server-final
  verify(serverFinal) {
    const parts = {}
    for (const part of serverFinal.split(',')) {
      const eq = part.indexOf('=')
      parts[part.slice(0, eq)] = part.slice(eq + 1)
    }
    if (parts['v'] !== this.serverSignature) {
      throw new Error('SCRAM: server signature mismatch')
    }
    return true
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  console.log('🧹 Connecting to NeonDB...')
  console.log(`   Host: ${host}:${port}`)
  console.log(`   DB:   ${database}`)
  console.log(`   User: ${user}\n`)

  const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: false })
  let recvBuf = Buffer.alloc(0)
  let phase = 'startup'
  const scram = new ScramClient(password)

  socket.on('secureConnect', () => {
    socket.write(buildStartupMessage(user, database))
  })

  socket.on('data', (chunk) => {
    recvBuf = Buffer.concat([recvBuf, chunk])
    const { messages, remaining } = parseMessages(recvBuf)
    recvBuf = remaining

    for (const { type, body } of messages) {
      if (type === 'R') {
        const authType = body.readUInt32BE(0)

        if (authType === 0) {
          console.log('✅ Authenticated!')
          phase = 'wait-ready'

        } else if (authType === 10) {
          // AuthenticationSASL — server lists mechanisms
          // Body: int32(10) + null-terminated mechanism names + extra null
          // We'll use SCRAM-SHA-256
          const mechanism = 'SCRAM-SHA-256'
          const msg = scram.clientFirst()
          // SASLInitialResponse: mechanism\0 + int32(msg_len) + msg
          const mechBuf = Buffer.from(mechanism + '\0', 'utf8')
          const msgBuf = Buffer.from(msg, 'utf8')
          const lenBuf = Buffer.allocUnsafe(4)
          lenBuf.writeInt32BE(msgBuf.length, 0)
          const saslInit = Buffer.concat([mechBuf, lenBuf, msgBuf])
          socket.write(buildMsg('p', saslInit))

        } else if (authType === 11) {
          // AuthenticationSASLContinue — server sends server-first-message
          const serverFirst = body.slice(4).toString('utf8')
          const clientFinal = scram.clientFinal(serverFirst)
          socket.write(buildMsg('p', clientFinal + ''))

        } else if (authType === 12) {
          // AuthenticationSASLFinal — server sends server-final-message
          const serverFinal = body.slice(4).toString('utf8')
          scram.verify(serverFinal)
          // auth complete, wait for AuthenticationOk (R with int32=0) or Z

        } else {
          console.error('Unsupported auth type:', authType)
          socket.destroy()
          process.exit(1)
        }

      } else if (type === 'Z') {
        if (phase === 'wait-ready' || phase === 'startup') {
          console.log('✅ Ready for query!\n')
          console.log('🗑️  Truncating all tables with CASCADE...\n')
          phase = 'query'
          socket.write(buildSimpleQuery(truncateSQL))
        } else if (phase === 'query') {
          console.log('\n' + '='.repeat(60))
          console.log('✅ DATABASE CLEANUP COMPLETE!')
          console.log('='.repeat(60))
          console.log('\n🧼 All records deleted. Schema and sequences reset.\n')
          phase = 'done'
          socket.destroy()
          process.exit(0)
        }

      } else if (type === 'C') {
        const tag = body.toString('utf8').replace(/\0/g, '')
        console.log('   ✓ ' + tag)

      } else if (type === 'E') {
        console.error('\n❌ PostgreSQL Error:', parseErrorBody(body))
        socket.destroy()
        process.exit(1)

      }
      // N (Notice), S (ParameterStatus), K (BackendKeyData) — silently ignore
    }
  })

  socket.on('error', (err) => {
    console.error('❌ Socket error:', err.message)
    process.exit(1)
  })

  socket.on('close', () => {
    if (phase !== 'done') {
      console.error('❌ Connection closed unexpectedly in phase:', phase)
      process.exit(1)
    }
  })
}

run()
