module.exports = {
  "extends": [
    'airbnb-typescript/base',
    "react-app",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended"
  ],
  "parserOptions": {
    project: './tsconfig.json'
  },
  "settings": {
    "react": {
      "version": "999.999.999"
    }
  }
}
