# 1. clean dist
rm -rf ./lib
rm -rf ./dist

# 2. tsc compile 
npx tsc

# 3. copy source file
npx copyup 'src/**/*.html' lib/
npx copyup 'src/**/*.less' lib/

# 4. webpack build
npm run build:web
