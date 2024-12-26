import path from 'path';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// minify json before copying
const srcTreePath = path.resolve(__dirname, 'src/allAddTree.json');
const tempTreePath = path.resolve(__dirname, 'src/tempAllAddTree.json');
const distTreePath = path.resolve(__dirname, 'public/allAddTree.json');

const rawJson = JSON.parse(fs.readFileSync(srcTreePath, 'utf8'));

// const minifiedJson = jsonMinify(rawJson);
const minifiedJson = JSON.stringify(rawJson);
fs.writeFileSync(tempTreePath, minifiedJson);

export default {
    mode: 'development',
    entry: './src/main.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'public')
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ],
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/,
                type: 'asset/resource', // the asset module treat it as a resource
                generator: {
                    filename: 'assets/images/[name][hash][ext][query]',
                },
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'styles.css',
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/assets/images', to: 'assets/images' }
            ],
        }),
        new CopyPlugin({
            patterns: [
              { from: tempTreePath, to: distTreePath }
            ]
          })
    ]
};