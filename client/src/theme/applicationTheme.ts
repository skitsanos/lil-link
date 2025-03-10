/**
 * Ant.Design Application theme
 */
import {ThemeConfig} from 'antd/es/config-provider/context';
import {theme} from 'antd';

const colorPrimary = '#5A358C';
const colorPrimaryHover = '#f3eef9';
const colorTheme = '#5A358C';
const colorThemeMetal = '#5e536e';

const applicationTheme: ThemeConfig = {
    algorithm: theme.defaultAlgorithm,
    token: {
        fontFamily: 'IBM Plex Sans, sans-serif',
        fontSize: 14,
        colorPrimary: colorPrimary,
        colorInfo: colorPrimary,
        colorError: 'crimson',
        colorSuccess: '#73d98a',
        borderRadius: 3,
        //colorBgBase:  //'#f0f2f5',
        colorBgBase: '#fff'
    },

    components: {
        Layout: {
            bodyBg: '#efefef',
            headerBg: colorTheme,
            colorBgContainer: `${colorTheme} !important`,

            siderBg: `${colorThemeMetal} !important`,
            lightSiderBg: `${colorThemeMetal} !important`
        },

        Menu: {
            itemSelectedColor: '#fff !important'
        },

        Avatar: {
            colorTextPlaceholder: `#878090 !important`
        },

        Breadcrumb: {
            linkHoverColor: `${colorPrimaryHover} !important`,
            colorPrimaryHover: `${colorPrimaryHover} !important`
        },

        Input: {
            fontFamily: 'IBM Plex Mono, monospace'
        },

        Radio: {
            colorPrimary
        },

        Card: {
            controlItemBgActive: '#fff'
        },

        Button: {
            colorPrimary,
            colorLink: colorPrimary,
            colorPrimaryHover: colorTheme,
            colorIcon: colorPrimary,
            borderRadius: 3,
            defaultBg: `${colorPrimaryHover} !important`,
            defaultColor: `${colorPrimary} !important`,
            defaultHoverBorderColor: colorPrimary,
            defaultShadow: 'none'
        },

        Statistic: {
            colorTextHeading: colorPrimary
        },

        Alert: {
            defaultPadding: 4,
            colorInfoBg: '#f3eef9',
            colorWarningBg: '#fff7e6'
        },

        Popover: {
            titleMinWidth: 300
        },

        Modal: {
            //colorError: 'crimson !important',
            //colorErrorBorder:'crimson !important',
        }
    }
};

export default applicationTheme;
