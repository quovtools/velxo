const fs = require('fs');
const c = fs.readFileSync('schema_fresh.sql', 'utf8');
const enumRe = /^CREATE TYPE "([^"]+)" AS ENUM (\([^;]*\));/gm;
let out = c.replace(enumRe, (_, name, body) =>
`DO $x$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${name}') THEN
    CREATE TYPE "${name}" AS ENUM ${body};
  END IF;
END $x$;
`);
const tblRe = /^CREATE TABLE "([^"]+)"/gm;
out = out.replace(tblRe, 'CREATE TABLE IF NOT EXISTS "$1"');
fs.writeFileSync('apply_idem.sql', out);
console.log('wrote apply_idem.sql, lines:', out.split(/\r?\n/).length);
