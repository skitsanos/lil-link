import {apiPost, endpoints} from '@/api';
import useSession from '@/hooks/useSession';
import {useRequest} from 'ahooks';
import {Button, Card, Flex, Form, Input, notification, Tabs} from 'antd';
import {useEffect, useState} from 'react';
import {history} from 'umi';

const LoginSignupForm = ({mode}: { mode: 'register' | 'signIn' }) =>
{
    const {login} = useSession();
    const [form] = Form.useForm();

    const {
        data,
        error,
        loading,
        run
    } = useRequest(payload => apiPost(mode === 'register' ? endpoints.signup : endpoints.login, {
        data: payload,
        getResponse: true
    }), {manual: true});

    // Submit the form data to an API
    const onFinish = (values) =>
    {
        run(values);
    };

    // Watch for the possible API errors
    useEffect(() =>
    {
        if (error)
        {
            const {
                response,
                data: errData
            } = error as Record<string, any>;

            const {status} = response;

            if (status === 401)
            {
                notification.error({
                    message: 'Authentication error',
                    description: errData.message
                });
            }
            else if (status === 409)
            {
                // Conflict. Already registered
                notification.error({
                    message: 'Account already exists',
                    description: 'An account with this email address already exists. Please sign in.'
                });
            }
            else
            {
                notification.error({
                    message: 'Network error',
                    description: `An error occurred while processing your request. Please try again later.`
                });
            }
        }
    }, [error]);

    // Process the login response
    useEffect(() =>
    {
        const {data: responseData} = data || {};
        if (responseData)
        {
            if (mode === 'register')
            {
                notification.success({
                    message: 'Account created',
                    description: 'Your account has been created successfully. You can now sign in.'
                });

                form.resetFields();
            }

            if (mode === 'signIn')
            {
                const {token} = responseData || {};
                if (!token)
                {
                    notification.error({
                        message: 'Authentication error',
                        description: 'Server did not return a token. Please try again later.'
                    });
                }
                else
                {
                    login({
                        token,
                        user: responseData.user || {}
                    });

                    // Redirect to dashboard
                    history.push('/');
                }
            }
        }
    }, [
        data,
        form,
        login,
        mode
    ]);

    return (
        <>
            <div className={'silent mb'}>
                {mode === 'register'
                 ? 'Create an account to manage your shortened URLs'
                 : 'Sign in to your account'}
            </div>
            <Form
                form={form}
                layout={'vertical'}
                onFinish={onFinish}
            >
                <Form.Item
                    label={'Email'}
                    name={'email'}
                    rules={[
                        {
                            required: true,
                            message: 'Email is required'
                        },
                        {
                            type: 'email',
                            message: 'Invalid email address'
                        }
                    ]}>
                    <Input autoFocus={true}
                           autoCapitalize={'off'}
                           autoComplete={'off'}
                           autoCorrect={'off'}
                    />
                </Form.Item>

                <Form.Item
                    label={'Password'}
                    name={'password'}
                    rules={[
                        {
                            required: true,
                            message: 'Password is required'
                        },
                        {
                            min: 6,
                            message: 'Password must be at least 6 characters'
                        }
                    ]}>
                    <Input.Password autoCapitalize={'off'}
                                    autoComplete={'off'}
                                    autoCorrect={'off'}
                    />
                </Form.Item>

                <Button type={'primary'}
                        loading={loading}
                        htmlType="submit"
                        block>
                    {mode === 'register' ? 'Create Account' : 'Sign In'}
                </Button>
            </Form>
        </>
    );
};

const Index = () =>
{
    const [mode, setMode] = useState<'register' | 'signIn'>('signIn');

    return (
        <div className={'page-login'}>
            <Flex
                align={'center'}
                style={{
                    minHeight: '80vh'
                }}
                gap={32}
                justify={'center'}
            >
                <Card
                    className="w-full max-w-md"
                    style={{
                        minWidth: '400px'
                    }}
                >
                    <h1>{APP_NAME}</h1>
                    <Flex
                        gap={16}
                        className="flex items-center gap-2 mb-2"
                    >
                        <h3>Welcome to URL Shortener</h3>
                    </Flex>

                    <Tabs
                        destroyInactiveTabPane={true}
                        items={[
                            {
                                key: 'signIn',
                                label: 'Sign In',
                                children: <LoginSignupForm mode="signIn"/>
                            },
                            {
                                key: 'register',
                                label: 'Create Account',
                                children: <LoginSignupForm mode="register"/>
                            }
                        ]}
                        activeKey={mode}
                        onChange={(key) => setMode(key as 'register' | 'signIn')}
                    />
                </Card>

                <Flex gap={8}
                      vertical={true}
                      justify={'center'}
                      style={{
                          maxWidth: '400px'
                      }}>
                    <h2 className="text-2xl">Share Links Efficiently</h2>
                    <p className="text-lg">
                        Create shortened URLs that are easy to share and track. Monitor clicks
                        and manage all your links in one place.
                    </p>
                </Flex>
            </Flex>
        </div>
    );
};

export default Index;