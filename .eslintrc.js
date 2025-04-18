module.exports = {
  extends: ['react-app'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn', // Downgrade to warning
    'react-hooks/exhaustive-deps': 'warn' // Downgrade to warning
  }
}
