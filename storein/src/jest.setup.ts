// Windows dev machines point at a local mongod install; everywhere else
// (Linux/Mac, CI) mongodb-memory-server manages its own binary, matching
// how the e2e suite's global-setup already works.
if (process.platform === 'win32') {
  process.env.MONGOMS_SYSTEM_BINARY =
    'C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe';
}
