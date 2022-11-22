# 1. clean dist
rm -rf ./lib
rm -rf ./dist

# 2. tsc compile 
`npm bin`/tsc

# 3. copy source file
`npm bin`/copyup 'src/**/*.html' lib/
`npm bin`/copyup 'src/**/*.less' lib/

# 4. webpack build
npm run build:web
