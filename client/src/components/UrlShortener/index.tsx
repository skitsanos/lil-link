import {FC, useEffect, useRef} from 'react';
import {Button, Flex, Form, Input, notification} from 'antd';
import {CopyOutlined} from '@ant-design/icons';
import {useRequest} from 'ahooks';
import {apiPost, endpoints} from '@/api';

const UrlShortener: FC = () =>
{
    const [form] = Form.useForm();

    const {
        data,
        loading,
        error,
        run: generateUrl
    } = useRequest((url: string) => apiPost(endpoints.url, {
        data: {
            longUrl: url
        }
    }), {manual: true});

    useEffect(() =>
    {
        if (error)
        {
            notification.error({
                message: 'Failed to generate URL'
            });
        }
    }, [error]);

    useEffect(() =>
    {
        if (data)
        {
            console.log(data);
            //refGeneratedUrl.current.input.value = data.data.shortUrl;
            notification.info({
                message: 'URL generated'
            });
        }
    }, [data]);

    const refGeneratedUrl = useRef();

    const onFinish = ({url}: { url: string }) =>
    {
        generateUrl(url);
    };

    const copyToClipboard = () =>
    {
        console.log(refGeneratedUrl.current?.input.value);

        const {value} = refGeneratedUrl.current.input;

        if (value)
        {
            navigator.permissions.query({name: 'clipboard-write'}).then(result =>
            {
                if (result.state === 'granted' || result.state === 'prompt')
                {
                    navigator.clipboard.writeText(value).then(() =>
                    {
                        notification.info({
                            message: 'Copied to clipboard'
                        });
                    });
                }
            });
        }
    };

    return <Flex vertical={true}>
        <Form form={form}
              className={'h-box pt'}
              labelCol={{
                  span: 0
              }}
              wrapperCol={{
                  span: 24
              }}
              onFinish={onFinish}>
            <Form.Item label={'URL'}
                       name={'url'}
                       className={'w-100'}
                       rules={[
                           {
                               required: true,
                               message: 'Please input a URL'
                           }
                       ]}>
                <Input autoCapitalize={'off'}
                       autoFocus={true}
                       autoSave={'off'}
                       autoCorrect={'off'}/>
            </Form.Item>

            <Form.Item className={'ml-xs'}>
                <Button htmlType={'submit'}
                        type={'primary'}
                        loading={loading}>Generate</Button>
            </Form.Item>
        </Form>

        <Flex gap={'small'}>
            <Input ref={refGeneratedUrl}
                   readOnly={true}
                   value={data?.data?.shortUrl}
                   addonAfter={<Button size={'small'}
                                       loading={loading}
                                       disabled={!data?.data?.shortUrl}
                                       onClick={copyToClipboard}
                                       type={'text'}
                                       icon={<CopyOutlined/>}/>}
                   className={''}></Input>

        </Flex>

    </Flex>;
};

export default UrlShortener;