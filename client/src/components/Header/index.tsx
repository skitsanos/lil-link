import {Button, Col, Flex, Row, Space} from 'antd';
import {FC} from 'react';

interface HeaderProps
{
    title: string;
}

const Header: FC<HeaderProps> = ({title = 'My App'}) =>
{

    return <Row justify={'center'} className={'app-header'}>
        <Col xs={20} xxl={18}>
            <Flex justify={'space-between'}>
                <h2>{title}</h2>

                <Space>
                    <Button>Login/Signup</Button>
                </Space>
            </Flex>
        </Col>
    </Row>;
};

export default Header;