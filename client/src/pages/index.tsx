import ContentArea from '@/components/ContentArea';
import {gridGutter} from '@/defaults';
import ProCard from '@ant-design/pro-card';
import {Divider, Statistic} from 'antd';
import useSession from '@/hooks/useSession';
import {useRequest} from 'ahooks';
import {apiGet, endpoints} from '@/api';

const Page = () =>
{
    const {session} = useSession();

    const {
        data,
        loading
    } = useRequest(() => apiGet(endpoints.stats));

    console.log(data);

    return <ContentArea title={'Welcome'}
                        subTitle={`You are logged as ${session.user.email} user`}>
        <ProCard direction={'row'}
                 loading={loading}
                 ghost={true}
                 gutter={gridGutter}
                 title={'Activity'}
                 subTitle={'Summary'}>

            <ProCard>
                <Statistic title={'Click/URL'}
                           value={data?.data.urlActivitySummary.avgClicksPerUrl}/>
            </ProCard>
            <ProCard>
                <Statistic title={'Total Active'}
                           value={data?.data.urlActivitySummary.totalActiveUrls}/>
            </ProCard>
            <ProCard>
                <Statistic title={'Total Clicks'}
                           value={data?.data.urlActivitySummary.totalClicks}/>
            </ProCard>
        </ProCard>

        <ProCard direction={'row'}
                 loading={loading}
                 ghost={true}
                 gutter={gridGutter}
                 title={'Usage'}
                 subTitle={'Status'}>

            <ProCard>
                <Statistic title={'Custom URLs'}
                           value={data?.data.usageStatus.customUrls.total}/>
            </ProCard>
            <ProCard>
                <Statistic title={'Expiting'}
                           value={data?.data.usageStatus.expiringUrls}/>
            </ProCard>
            <ProCard>
                <Statistic title={'Creation Rate'}
                           value={data?.data.usageStatus.urlCreationRate.current}/>
            </ProCard>
        </ProCard>

        <Divider/>

        <ProCard bordered={true}
                 direction={'column'}
                 gutter={gridGutter}>
            Placeholder for some text data

        </ProCard>
    </ContentArea>;
};

export default Page;