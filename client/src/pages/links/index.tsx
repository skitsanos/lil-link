import ContentArea from '@/components/ContentArea';
import {apiGet, endpoints} from '@/api';
import {usePagination} from 'ahooks';
import UrlShortener from '@/components/UrlShortener';
import {Button, Card, Pagination, Space, Table} from 'antd';
import {DeleteOutlined, ReloadOutlined} from '@ant-design/icons';
import {Link} from 'umi';

const getTableData = async (url: string, {
    current,
    pageSize,
    query = ''
}) =>
{
    const skip = current === 1 ? 0 : current * pageSize - pageSize;

    const q = query !== '' ? `${query}` : '';

    try
    {
        const apiCallResult = await apiGet(`${url}?skip=${skip}&pageSize=${pageSize}&q=${q}`);

        if (apiCallResult)
        {
            return ({
                total: apiCallResult.data.pagination.total,
                list: apiCallResult.data.urls
            });
        }

        return {
            total: 0,
            list: []
        };
    }
    catch (e)
    {
        return Promise.reject(e);
    }
};

export default () =>
{
    const {
        data,
        loading,
        pagination,
        refresh
    } = usePagination(({
                           current,
                           pageSize,
                           query
                       }) => getTableData(endpoints.url, {
        current,
        pageSize,
        query
    }), {
        defaultPageSize: 10
    });

    console.log(pagination);

    const columns = [
        {
            title: 'Slug',
            dataIndex: 'slug',
            render: (value: string) => <Link title={value}
                                             to={`/${value}`}
                                             target={'_blank'}>{value}</Link>
        },
        {
            title: 'Long URL',
            dataIndex: 'longUrl',
            ellipsis: {
                showTitle: false
            }
        },
        {
            title: '',
            width: 100,
            render: (_record: { _key: string }) => <Space>
                <Button icon={<DeleteOutlined/>}
                        disabled={true}
                        type={'link'}/>
            </Space>
        }
    ];

    return <ContentArea title={'Links'}>
        <Card className={'mb'}>
            <UrlShortener refresh={refresh}/>
        </Card>

        <Card extra={<Button icon={<ReloadOutlined/>}/>}>
            <Table loading={loading}
                   dataSource={data?.list}
                   pagination={false}
                   columns={columns}
                   rowKey={'_key'}/>

            <Pagination{...pagination} align={'end'}
                       showQuickJumper={true}
                       showSizeChanger={true}
                       style={{
                           marginTop: 16
                       }}/>
        </Card>
    </ContentArea>;
}