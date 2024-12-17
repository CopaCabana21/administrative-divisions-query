import path, { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
    mode: 'development',
    entry: './src/main.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'public'),

        library: 'mlib',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    resolve: {
        fallback: {
            "stream": false,
            "string_decoder": false,
        }
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
};