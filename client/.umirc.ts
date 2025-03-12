/**
 * Umijs configuration settings
 * Please refer to https://umijs.org/config for more details
 * or contact Evi Skitsanos https://www.linkedin.com/in/skitsanos/
 */
import dayjs from 'dayjs';

import manifest from './package.json';

export default ({
    title: 'Lil Links',

    favicons: [],

    styles: [
        'https://fonts.googleapis.com/css?family=IBM+Plex+Mono:400,400i|IBM+Plex+Sans:300,400&display=swap',
        'https://fonts.googleapis.com/css2?family=Work+Sans:wght@100;300;400&display=swap',
        'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@100;300;400&display=swap'
    ],

    headScripts: [
        {
            content: 'console.log("Hello from the head! Modify your .umirc.ts")'
        }
    ],

    define: {
        // the following are the default values for the application, and they are defined in @types/typings.d.ts
        APP_NAME: 'Lil\'Link',
        APP_VERSION: `${manifest.version} (beta/${dayjs().format('YYYY-MM-DD')})`,
        FEATURE_SMTP_ENABLED: false,
        FEATURE_SSL_ENABLED: true,

        INITIAL_SESSION: null
    },

    //mako: {},
    mfsu: {},

    svgr: {},

    deadCode: {},

    devtool: process.env.NODE_ENV === 'development' ? 'eval' : false,

    proxy: {
        '/api': {
            target: 'http://localhost:8000',
            changeOrigin: true,
            //pathRewrite: {'^/api': ''}
        }
    }
});
