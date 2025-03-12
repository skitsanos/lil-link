import {apiPost, endpoints} from '@/api';
import useSession from '@/hooks/useSession';
import {useRequest} from 'ahooks';
import {Button, Card, Flex, Form, Input, Tabs} from 'antd';
import {useEffect, useState} from 'react';
import {history} from 'umi';

const LoginSignupForm = ({mode}:{mode: 'register' | 'signIn'}) =>
{
    const {login} = useSession();

    const {
        data,
        error,
        loading,
        run
    } = useRequest(payload => apiPost(mode==='register'? endpoints.signup: endpoints.login, {
        data: payload,
        getResponse: true
    }), {manual: true});

    const [authError, setAuthError] = useState(false);
    const [errMessage, setErrMessage] = useState(null);

    //submit the form data to an API
    const onFinish = (values) =>
    {
        //run(values);
        console.log(values);
    };

    //watch for the possible API errors
    useEffect(() =>
    {
        if (error)
        {
            const {
                response,
                data: errData
            } = error as Record<string, any>;
            const {status} = response;
            setAuthError(true);

            if (status === 401)
            {
                setErrMessage(errData.message);
            }
            else
            {
                setErrMessage(`Network error occurred. Err#${status}`);
            }
        }
    }, [error]);

    //process the login response
    useEffect(() =>
    {
        const {data: responseData} = data || {};
        if (responseData)
        {
            const {session} = responseData?.result || {};
            const {token} = session || {};
            if (token)
            {
                login(responseData.result);

                history.push('/');
            }
        }
    }, [data]);

    return <>
        <div className={'silent mb'}>
            {mode === 'register'
             ? 'Create an account to manage your shortened URLs'
             : 'Sign in to your account'}
        </div>
        <Form layout={'vertical'}
              onFinish={onFinish}>
            <Form.Item label={'Email'}
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
                       autoCorrect={'off'}/>
            </Form.Item>

            <Form.Item label={'Password'}
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
                                autoCorrect={'off'}/>
            </Form.Item>

            <Button type={'primary'}
                    loading={loading}
                    htmlType="submit"
                    block>
                {mode === 'register' ? 'Create Account' : 'Sign In'}
            </Button>
        </Form>
    </>;
};

const Index = () =>
{
    const [mode, setMode] = useState<'register' | 'signIn'>('register');

    return <div className={'page-login'}>

        <Flex align={'center'}
              style={{
                  //height: '100vh',
              }}
              gap={32}
              justify={'center'}>
            <Card className="w-full max-w-md"
                  style={{
                      minWidth: '400px'
                  }}>
                <h1>{APP_NAME}</h1>
                <Flex gap={16}
                      className="flex items-center gap-2 mb-2">
                    <h3>Welcome to URL Shortener</h3>
                </Flex>

                <Tabs items={[
                    {
                        key: 'register',
                        label: 'Create Account',
                        children: <LoginSignupForm mode={mode}/>
                    },
                    {
                        key: 'signIn',
                        label: 'Sign In',
                        children: <LoginSignupForm mode={mode}/>
                    }
                ]}
                      onChange={(key) => setMode(key as 'register' | 'signIn')}/>
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
    </div>;
};

export default Index;
