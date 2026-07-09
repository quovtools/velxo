const fs = require('fs');
const src = 'create_tables.sql';
const out = 'create_only.sql';
const lines = fs.readFileSync(src, 'utf8').split(/\r?\n/);
const res = [];
let skip = false;
for (const line of lines) {
  if (/^-- CreateEnum/.test(line)) { skip = true; continue; }
  if (skip) {
    // skip everything until the matching END $x$;
    if (/END \$\w+\$;\s*$/.test(line)) skip = false;
    continue;
  }
  res.push(line);
}
fs.writeFileSync(out, res.join('\n'));
console.log('kept lines:', res.length);
