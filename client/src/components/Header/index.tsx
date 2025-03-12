import {Button, Col, ConfigProvider, Flex, Row, Space, theme} from 'antd';
import {FC} from 'react';
import useSession from '@/hooks/useSession';
import {history} from 'umi';

interface HeaderProps
{
    title: string;
}

const Header: FC<HeaderProps> = ({title = 'My App'}) =>
{
    const {session} = useSession();

    return <ConfigProvider theme={{
        algorithm: theme.darkAlgorithm,
        inherit: false
    }}>
        <Row justify={'center'}>
        <Col xs={20}
             xxl={18}>
            <Flex justify={'space-between'}>
                <h2>{title}</h2>

                {!session && <Space>
                    <Button type={'link'}
                            onClick={() =>
                            {
                                history.push('/login');
                            }}>Login/Signup</Button>
                </Space>}

                {session && <Space>
                    <Button type={'link'}>Dashboard</Button>
                    <Button type={'link'}
                            onClick={() =>
                            {
                                history.push('/logout');
                            }}>Logout</Button>
                </Space>}
            </Flex>
        </Col>
    </Row>
    </ConfigProvider>;
};

export default Header;