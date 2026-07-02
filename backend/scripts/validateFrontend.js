const fs   = require('fs');
const path = require('path');
const base = path.join('c:', 'Users', 'S Oviya', 'Downloads', 'SE_PROJECT', 'frontend');

let allOk = true;

function check(label, condition) {
  if (condition) {
    console.log('  ✔', label);
  } else {
    console.error('  ❌', label);
    allOk = false;
  }
}

// --- File existence checks ---
console.log('\n[1] File Existence Checks');
const required = [
  'login.html', 'register.html',
  'css/index.css', 'css/auth.css', 'css/components.css',
  'js/api.js', 'js/auth.js'
];
required.forEach(f => {
  const fp = path.join(base, f);
  const exists = fs.existsSync(fp);
  const size   = exists ? fs.statSync(fp).size : 0;
  check(`${f} (${size} bytes)`, exists && size > 0);
});

// --- login.html content checks ---
console.log('\n[2] login.html Content Checks');
const login = fs.readFileSync(path.join(base, 'login.html'), 'utf8');
check('Links css/index.css',    login.includes('css/index.css'));
check('Links css/auth.css',     login.includes('css/auth.css'));
check('Links js/api.js',        login.includes('js/api.js'));
check('Links js/auth.js',       login.includes('js/auth.js'));
check('Has login-form id',      login.includes('id="login-form"'));
check('Has email input',        login.includes('id="email"'));
check('Has password input',     login.includes('id="password"'));
check('Has email-error span',   login.includes('id="email-error"'));
check('Has password-error span',login.includes('id="password-error"'));
check('Has btn-auth submit',    login.includes('btn-auth'));
check('Links to register.html', login.includes('register.html'));

// --- register.html content checks ---
console.log('\n[3] register.html Content Checks');
const reg = fs.readFileSync(path.join(base, 'register.html'), 'utf8');
check('Links css/index.css',    reg.includes('css/index.css'));
check('Links css/auth.css',     reg.includes('css/auth.css'));
check('Links js/api.js',        reg.includes('js/api.js'));
check('Links js/auth.js',       reg.includes('js/auth.js'));
check('Has register-form id',   reg.includes('id="register-form"'));
check('Has name input',         reg.includes('id="name"'));
check('Has email input',        reg.includes('id="email"'));
check('Has password input',     reg.includes('id="password"'));
check('Has name-error span',    reg.includes('id="name-error"'));
check('Has email-error span',   reg.includes('id="email-error"'));
check('Has password-error span',reg.includes('id="password-error"'));
check('Has btn-auth submit',    reg.includes('btn-auth'));
check('Links to login.html',    reg.includes('login.html'));

// --- api.js checks ---
console.log('\n[4] api.js Content Checks');
const apiJs = fs.readFileSync(path.join(base, 'js/api.js'), 'utf8');
check('Defines window.api',        apiJs.includes('window.api'));
check('Has showToast function',    apiJs.includes('const showToast'));
check('Has request function',      apiJs.includes('const request'));
check('Handles 401 redirect',      apiJs.includes('response.status === 401'));
check('Has api.get method',        apiJs.includes("get:"));
check('Has api.post method',       apiJs.includes("post:"));
check('Has api.put method',        apiJs.includes("put:"));
check('Has api.delete method',     apiJs.includes("delete:"));

// --- auth.js checks ---
console.log('\n[5] auth.js Content Checks');
const authJs = fs.readFileSync(path.join(base, 'js/auth.js'), 'utf8');
check('Uses window.api.post',       authJs.includes('window.api.post'));
check('Uses window.api.showToast',  authJs.includes('window.api.showToast'));
check('Handles login-form',         authJs.includes('login-form'));
check('Handles register-form',      authJs.includes('register-form'));
check('Validates name field',       authJs.includes('nameInput'));
check('Validates email field',      authJs.includes('emailInput'));
check('Validates password field',   authJs.includes('passwordInput'));
check('Saves token to localStorage',authJs.includes("localStorage.setItem('token'"));
check('Saves user to localStorage', authJs.includes("localStorage.setItem('user'"));
check('Redirects to dashboard',     authJs.includes('dashboard.html'));

// --- CSS checks ---
console.log('\n[6] CSS Design Token Checks');
const indexCss = fs.readFileSync(path.join(base, 'css/index.css'), 'utf8');
check('Has --primary variable',     indexCss.includes('--primary:'));
check('Has --bg-surface variable',  indexCss.includes('--bg-surface:'));
check('Has --text-primary variable',indexCss.includes('--text-primary:'));
check('Has --shadow-lg variable',   indexCss.includes('--shadow-lg:'));
check('Has .btn-primary styles',    indexCss.includes('.btn-primary'));
check('Has .form-input styles',     indexCss.includes('.form-input'));
check('Has .form-error-msg styles', indexCss.includes('.form-error-msg'));
check('Has .is-invalid styles',     indexCss.includes('.is-invalid'));
check('Has .toast styles',          indexCss.includes('.toast'));
check('Has @keyframes slideIn/toast',indexCss.includes('@keyframes'));

const authCss = fs.readFileSync(path.join(base, 'css/auth.css'), 'utf8');
check('Has .auth-wrapper',          authCss.includes('.auth-wrapper'));
check('Has .auth-card',             authCss.includes('.auth-card'));
check('Has .auth-logo-wrap',        authCss.includes('.auth-logo-wrap'));
check('Has .btn-auth',              authCss.includes('.btn-auth'));
check('Has @media responsive rule', authCss.includes('@media'));
check('Has card entrance animation',authCss.includes('@keyframes'));

console.log(allOk ? '\n✅ ALL CHECKS PASSED — Module 4 frontend files are valid.' 
                  : '\n❌ SOME CHECKS FAILED — Review issues above.');
process.exit(allOk ? 0 : 1);
