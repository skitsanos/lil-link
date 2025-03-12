import {DashboardOutlined, LinkOutlined, LogoutOutlined, SettingOutlined} from '@ant-design/icons';

const sidebarMenu = {
    route: {
        path: '/',
        routes: [
            {
                path: '/',
                icon: <DashboardOutlined/>,
                name: 'Dashboard'
            },

            {
                path: '/links',
                name: 'Links',
                icon: <LinkOutlined/>
            },

            {
                path: '/settings',
                icon: <SettingOutlined/>,
                name: 'Settings'
            },
            {
                path: '/logout',
                name: 'Logout',
                icon: <LogoutOutlined/>
            }
        ]
    }
};
export default sidebarMenu;