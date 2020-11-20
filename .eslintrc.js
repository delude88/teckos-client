module.exports = {
    "extends": [
        'airbnb-typescript/base',
        "react-app",
        "prettier/@typescript-eslint",
        "plugin:prettier/recommended"
    ],
    "settings": {
        "react": {
            "version": "999.999.999"
        }
    },
    "parserOptions": {
        "project": "./tsconfig.json"
    }
}
