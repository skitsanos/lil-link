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
import Header from '@/components/Header';

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

    return <App message={{maxCount: 1}}>
        <ConfigProvider locale={enUS}>
            <Header title={'Lil Link'}/>

            {!session && <Flex align={'center'}
                               style={{
                                   height: '100%'
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

            </Flex>}

            {!hasNoLayout.includes(location.pathname) && Boolean(session) && <ProLayout {...sidebarMenu}
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
