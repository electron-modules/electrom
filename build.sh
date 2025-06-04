# 1. clean dist
rm -rf ./lib
rm -rf ./dist

# 2. tsc compile 
./node_modules/.bin/tsc

# 3. copy source file
./node_modules/.bin/copyup 'src/**/*.html' lib/
./node_modules/.bin/copyup 'src/**/*.less' lib/

# 4. webpack build
npm run build:web
