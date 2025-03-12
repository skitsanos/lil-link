import {hasNoLayout, publicRoutes} from '@/defaults';
import useSession from '@/hooks/useSession';
import sidebarMenu from '@/sidebarMenu';
import ProLayout from '@ant-design/pro-layout';
import {App, Card, Col, ConfigProvider, Flex, Row} from 'antd';
import enUS from 'antd/locale/en_US';
import {useEffect} from 'react';
import {history, Link, Outlet, useLocation} from 'umi';
import {ReactComponent as IconLogo} from '@/assets/logo.svg';
import UrlShortener from '@/components/UrlShortener';
import {LockOutlined} from '@ant-design/icons';
import ApplicationTheme from '@/theme';

// Define APP_NAME constant if it's not defined elsewhere
const APP_NAME = 'LilLink';

const Container = () =>
{
    const location = useLocation();
    const pathname = location.pathname;

    const allowed = publicRoutes.includes(pathname);
    const isNoLayoutPage = hasNoLayout.includes(pathname);
    const {session} = useSession();
    const hasSession = !!session?.token;
    console.log(hasSession, session);

    useEffect(() =>
    {
        if (!allowed && !hasSession)
        {
            history.push('/login');
        }
    }, [
        session,
        allowed,
        hasSession
    ]);

    const menuItemRender = (item, dom) => <Link to={item.path}>{dom}</Link>;

    return <App message={{maxCount: 1}}>
        <ConfigProvider locale={enUS}
                        theme={ApplicationTheme}>
            {/* Unauthenticated users on normal pages */}
            {!hasSession && !isNoLayoutPage && <ProLayout layout={'top'}
                                                          fixedHeader={true}
                                                          location={{pathname}}
                                                          route={{
                                                              path: '/',
                                                              routes: [
                                                                  {
                                                                      path: '/login',
                                                                      icon: <LockOutlined/>,
                                                                      name: 'Login/Signup'
                                                                  }
                                                              ]
                                                          }}
                                                          title={APP_NAME}
                                                          logo={null}
                                                          menuProps={{
                                                              style: {
                                                                  width: '100%',
                                                                  justifyContent: 'flex-end'
                                                              }
                                                          }}
                                                          menuItemRender={menuItemRender}>
                <Flex align={'center'}
                      style={{
                          height: '100% !important'
                      }}>
                    <Row className={'w-100'}
                         justify={'center'}>
                        <Col xs={24}
                             md={12}>
                            <h2>LilLink URL Shortener</h2>
                            <p className={'silent'}>Shorten your long URLs in one click</p>
                            <Card>
                                <UrlShortener/>
                            </Card>
                        </Col>
                    </Row>
                </Flex>
            </ProLayout>}

            {/* Authenticated users on normal pages */}
            {hasSession && !isNoLayoutPage && <ProLayout
                {...sidebarMenu}
                layout={'side'}
                fixSiderbar={true}
                fixedHeader={true}
                title={APP_NAME}
                logo={<IconLogo width={24}/>}
                location={{pathname}}
                menuItemRender={menuItemRender}
                siderMenuType={'group'}
                menu={{
                    //collapsedShowGroupTitle: true
                }}>
                <Outlet context={{session}}/>
            </ProLayout>}

            {/* No layout pages (regardless of authentication) */}
            {isNoLayoutPage && <Outlet context={hasSession ? {session} : undefined}/>}
        </ConfigProvider>
    </App>;
};

export default Container;