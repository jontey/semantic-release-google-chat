// rollup.config.js
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'index.js',
  output: {
    dir: 'dist',
    format: 'cjs'
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    json()
  ]
};
