const config = {
  presets: [
    [
      '@babel/preset-env', {
        targets: {
          browsers: [
            'last 2 versions',
            'Safari >= 9',
            'IE >= 11',
            'last 2 iOS major versions',
          ],
          node: 'current',
        },
        useBuiltIns: 'entry',
      },
    ],
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-transform-react-jsx',
    '@babel/plugin-proposal-class-properties',
  ],
}


module.exports = config
