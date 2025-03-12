import {hasNoLayout, publicRoutes} from '@/defaults';
import useSession from '@/hooks/useSession';
import sidebarMenu from '@/sidebarMenu';
import ProLayout from '@ant-design/pro-layout';
import {App, Card, Col, ConfigProvider, Flex, Row} from 'antd';
import enUS from 'antd/locale/en_US';
import {useEffect} from 'react';
import {Link, Outlet, useLocation} from 'umi';
import {ReactComponent as IconLogo} from '@/assets/logo.svg';
import UrlShortener from '@/components/UrlShortener';
import {LinkOutlined, LockOutlined} from '@ant-design/icons';
import ApplicationTheme from '@/theme';

const Container = () =>
{
    const location = useLocation();

    const allowed = publicRoutes.includes(location.pathname);

    const {session} = useSession();

    useEffect(() =>
    {

    }, [
        session,
        allowed
    ]);

    const menuItemRender = (item, dom) => <Link to={item.path}>{dom}</Link>;

    console.log(session)

    return <App message={{maxCount: 1}}>
        <ConfigProvider locale={enUS} theme={ApplicationTheme}>
            {!session?.token && !hasNoLayout.includes(document.location.pathname) && <>
                <ProLayout layout={'top'}
                           fixedHeader={true}
                           location={{
                               pathname: location.pathname
                           }}
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
                           title={'LilLink'}
                           logo={<LinkOutlined/>}
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
                </ProLayout>
            </>}

            {session?.token && !hasNoLayout.includes(document.location.pathname) && <ProLayout {...sidebarMenu}
                                                                                        layout={'side'}
                                                                                        fixSiderbar={true}
                                                                                        fixedHeader={true}
                                                                                        title={APP_NAME}
                                                                                        logo={<IconLogo width={24}/>}
                                                                                        location={{
                                                                                            pathname: location.pathname
                                                                                        }}
                                                                                        menuItemRender={menuItemRender}
                                                                                        siderMenuType={'group'}
                                                                                        menu={{
                                                                                            //collapsedShowGroupTitle:
                                                                                            // true
                                                                                        }}>

                <Outlet context={{
                    session
                }}/>
            </ProLayout>}

            {hasNoLayout.includes(document.location.pathname) && !session && <Outlet/>}

        </ConfigProvider>
    </App>;
};

export default Container;
