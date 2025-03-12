import ContentArea from '@/components/ContentArea';
import {gridGutter} from '@/defaults';
import ProCard from '@ant-design/pro-card';
import {Divider, Statistic} from 'antd';
import useSession from '@/hooks/useSession';

const Page = () =>
{
    const {session} = useSession();

    return <ContentArea title={'Welcome'}
                        subTitle={`You are logged as ${session.user.email} user`}>
        <ProCard direction={'row'}
                 ghost={true}
                 gutter={gridGutter}
                 title={'Stats'}
                 subTitle={'Your current situation'}>

            <ProCard>
                <Statistic title={'Links'}
                           value={256}/>
            </ProCard>
            <ProCard>
                <Statistic title={'Clicks'}
                           value={77}
                           suffix={'K'}/>
            </ProCard>
            <ProCard>
                <Statistic title={'Served data'}
                           value={16}
                           suffix={'Gb'}/>
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