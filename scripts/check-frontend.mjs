// Verificación estática sin dependencias para el frontend HTML/JS de Ollin.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const files = [
  'index.html', 'inicio.html', 'Museums.html', 'MisFavoritos.html',
  'MisVisitados.html', 'Aventuras_proximas.html', 'AventuraEnCurso.html',
  'perfilTurista.html', 'editarAventura.html', 'SingleRoute.html',
  'aventuras_pasadas.html', 'registro_turista_ES.html',
  'recuperacion_de_cuenta_ES.html', 'pagesAdmin/login_Admin.html',
  'pagesAdmin/recuperacion_de_cuenta_Admin.html', 'pagesAdmin/registro_Admin.html'
];
const source = (path) => readFileSync(resolve(root, path), 'utf8');

for (const page of files) {
  const html = source(page);
  assert.match(html, /<body class="ollin-refresh(?: ollin-auth(?:-form)?)?">/, page + ' debe usar los estilos renovados');
  assert.match(html, /\/styles\/ollin-refresh\.css/, page + ' sin CSS del rediseño');
  assert.match(html, /\/js\/ollin-enhancements\.js/, page + ' sin mejoras compartidas');
  assert.equal((html.match(/<body(?:\s|>)/g) || []).length, 1, page + ': etiqueta body duplicada');
  assert.equal((html.match(/<\/body>/g) || []).length, 1, page + ': cierre body incorrecto');
}

const expected = {
  'index.html': ['id="login"', 'id="loginMessage"', 'ollin-auth-story'],
  'inicio.html': ['ollin-welcome', 'href="/museums"', 'href="/aventuras_proximas"'],
  'Museums.html': ['id="museodes"', 'id="searchMuseoInput"', 'id="filterSend"', 'id="filterErase"'],
  'Aventuras_proximas.html': ['id="containerItinerarios"', 'id="formNuevaAventura"']
};
for (const [page, parts] of Object.entries(expected)) {
  const html = source(page);
  for (const part of parts) assert.ok(html.includes(part), page + ' requiere ' + part);
}

for (const localFile of ['styles/ollin-refresh.css', 'js/ollin-enhancements.js']) {
  assert.ok(existsSync(resolve(root, localFile)), localFile + ' no existe');
}

const scripts = [
  'ARCY-PRUEBAS/login.js', 'ARCY-PRUEBAS/admin.js',
  'ARCY-PRUEBAS/loginAdmin.js', 'js/validation_register.js',
  'js/ollin-enhancements.js', 'js/itinerariosDes.js', 'js/musdes.js'
];
for (const script of scripts) {
  const checked = spawnSync(process.execPath, ['--check', '--input-type=module'], {
    input: source(script),
    encoding: 'utf8'
  });
  assert.equal(checked.status, 0, script + ': error de sintaxis\n' + checked.stderr);
}

assert.ok(!source('ARCY-PRUEBAS/login.js').includes('ollin-backend-production-a735'),
  'La ruta de login aún apunta al Railway anterior');
console.log('Ollin: verificación estática correcta (' + files.length + ' páginas, ' + scripts.length + ' scripts).');
