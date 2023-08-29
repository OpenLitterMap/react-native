import React, {PureComponent} from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {Header, Title} from '../components';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface User {
    global_flag: string;
    name: string;
    rank: number;
    social: any;
    team: string;
    username: string;
    xp: string;
}

interface Flag {
    [key: string]: any;
}

interface PickerItem {
    label: string;
    value: string;
    visible: boolean;
}

interface LeaderboardScreenState {
    loading: boolean;
    flags: Flag;
    pickerItems: PickerItem[];
    selectedValue: string;
}

interface LeaderboardScreenProps {
    lang: string;
    paginated: {
        users: User[];
    };
}

class LeaderboardsScreen extends PureComponent<
    LeaderboardScreenProps,
    LeaderboardScreenState
> {
    constructor(props: LeaderboardScreenProps) {
        super(props);

        this.state = {
            loading: true,
            flags: {},
            pickerItems: [
                {label: 'Today', value: 'today', visible: true},
                {label: 'Yesterday', value: 'yesterday', visible: true},
                {label: 'This Month', value: 'this-month', visible: true},
                {label: 'Last Month', value: 'last-month', visible: true},
                {label: 'All Time', value: 'all-time', visible: true}
            ],
            selectedValue: 'today'
        };
    }

    async componentDidMount() {
        // @ts-ignore
        await this.props.getLeaderboardData('today');

        const flags: Flag = {
            ad: require('../../assets/icons/flags/ad.png'),
            ae: require('../../assets/icons/flags/ae.png'),
            af: require('../../assets/icons/flags/af.png'),
            ag: require('../../assets/icons/flags/ag.png'),
            ai: require('../../assets/icons/flags/ai.png'),
            al: require('../../assets/icons/flags/al.png'),
            am: require('../../assets/icons/flags/am.png'),
            an: require('../../assets/icons/flags/an.png'),
            ao: require('../../assets/icons/flags/ao.png'),
            aq: require('../../assets/icons/flags/aq.png'),
            ar: require('../../assets/icons/flags/ar.png'),
            as: require('../../assets/icons/flags/as.png'),
            at: require('../../assets/icons/flags/at.png'),
            au: require('../../assets/icons/flags/au.png'),
            aw: require('../../assets/icons/flags/aw.png'),
            ax: require('../../assets/icons/flags/ax.png'),
            az: require('../../assets/icons/flags/az.png'),
            ba: require('../../assets/icons/flags/ba.png'),
            bb: require('../../assets/icons/flags/bb.png'),
            bd: require('../../assets/icons/flags/bd.png'),
            be: require('../../assets/icons/flags/be.png'),
            bf: require('../../assets/icons/flags/bf.png'),
            bg: require('../../assets/icons/flags/bg.png'),
            bh: require('../../assets/icons/flags/bh.png'),
            bi: require('../../assets/icons/flags/bi.png'),
            bj: require('../../assets/icons/flags/bj.png'),
            bl: require('../../assets/icons/flags/bl.png'),
            bm: require('../../assets/icons/flags/bm.png'),
            bn: require('../../assets/icons/flags/bn.png'),
            bo: require('../../assets/icons/flags/bo.png'),
            bq: require('../../assets/icons/flags/bq.png'),
            br: require('../../assets/icons/flags/br.png'),
            bs: require('../../assets/icons/flags/bs.png'),
            bt: require('../../assets/icons/flags/bt.png'),
            bv: require('../../assets/icons/flags/bv.png'),
            bw: require('../../assets/icons/flags/bw.png'),
            by: require('../../assets/icons/flags/by.png'),
            bz: require('../../assets/icons/flags/bz.png'),
            ca: require('../../assets/icons/flags/ca.png'),
            cc: require('../../assets/icons/flags/cc.png'),
            cd: require('../../assets/icons/flags/cd.png'),
            cf: require('../../assets/icons/flags/cf.png'),
            cg: require('../../assets/icons/flags/cg.png'),
            ch: require('../../assets/icons/flags/ch.png'),
            ci: require('../../assets/icons/flags/ci.png'),
            ck: require('../../assets/icons/flags/ck.png'),
            cl: require('../../assets/icons/flags/cl.png'),
            cm: require('../../assets/icons/flags/cm.png'),
            cn: require('../../assets/icons/flags/cn.png'),
            co: require('../../assets/icons/flags/co.png'),
            cr: require('../../assets/icons/flags/cr.png'),
            cu: require('../../assets/icons/flags/cu.png'),
            cv: require('../../assets/icons/flags/cv.png'),
            cw: require('../../assets/icons/flags/cw.png'),
            cx: require('../../assets/icons/flags/cx.png'),
            cy: require('../../assets/icons/flags/cy.png'),
            cz: require('../../assets/icons/flags/cz.png'),
            de: require('../../assets/icons/flags/de.png'),
            dj: require('../../assets/icons/flags/dj.png'),
            dk: require('../../assets/icons/flags/dk.png'),
            dm: require('../../assets/icons/flags/dm.png'),
            do: require('../../assets/icons/flags/do.png'),
            dz: require('../../assets/icons/flags/dz.png'),
            ec: require('../../assets/icons/flags/ec.png'),
            ee: require('../../assets/icons/flags/ee.png'),
            eg: require('../../assets/icons/flags/eg.png'),
            eh: require('../../assets/icons/flags/eh.png'),
            er: require('../../assets/icons/flags/er.png'),
            es: require('../../assets/icons/flags/es.png'),
            et: require('../../assets/icons/flags/et.png'),
            eu: require('../../assets/icons/flags/eu.png'),
            fi: require('../../assets/icons/flags/fi.png'),
            fj: require('../../assets/icons/flags/fj.png'),
            fk: require('../../assets/icons/flags/fk.png'),
            fm: require('../../assets/icons/flags/fm.png'),
            fo: require('../../assets/icons/flags/fo.png'),
            fr: require('../../assets/icons/flags/fr.png'),
            ga: require('../../assets/icons/flags/ga.png'),
            gb: require('../../assets/icons/flags/gb.png'),
            'gb-eng': require('../../assets/icons/flags/gb-eng.png'),
            'gb-nir': require('../../assets/icons/flags/gb-nir.png'),
            'gb-sct': require('../../assets/icons/flags/gb-sct.png'),
            'gb-wls': require('../../assets/icons/flags/gb-wls.png'),
            gd: require('../../assets/icons/flags/gd.png'),
            ge: require('../../assets/icons/flags/ge.png'),
            gf: require('../../assets/icons/flags/gf.png'),
            gg: require('../../assets/icons/flags/gg.png'),
            gh: require('../../assets/icons/flags/gh.png'),
            gi: require('../../assets/icons/flags/gi.png'),
            gl: require('../../assets/icons/flags/gl.png'),
            gm: require('../../assets/icons/flags/gm.png'),
            gn: require('../../assets/icons/flags/gn.png'),
            gp: require('../../assets/icons/flags/gp.png'),
            gq: require('../../assets/icons/flags/gq.png'),
            gr: require('../../assets/icons/flags/gr.png'),
            gs: require('../../assets/icons/flags/gs.png'),
            gt: require('../../assets/icons/flags/gt.png'),
            gu: require('../../assets/icons/flags/gu.png'),
            gw: require('../../assets/icons/flags/gw.png'),
            gy: require('../../assets/icons/flags/gy.png'),
            hk: require('../../assets/icons/flags/hk.png'),
            hm: require('../../assets/icons/flags/hm.png'),
            hn: require('../../assets/icons/flags/hn.png'),
            hr: require('../../assets/icons/flags/hr.png'),
            ht: require('../../assets/icons/flags/ht.png'),
            hu: require('../../assets/icons/flags/hu.png'),
            id: require('../../assets/icons/flags/id.png'),
            ie: require('../../assets/icons/flags/ie.png'),
            il: require('../../assets/icons/flags/il.png'),
            im: require('../../assets/icons/flags/im.png'),
            in: require('../../assets/icons/flags/in.png'),
            io: require('../../assets/icons/flags/io.png'),
            iq: require('../../assets/icons/flags/iq.png'),
            ir: require('../../assets/icons/flags/ir.png'),
            is: require('../../assets/icons/flags/is.png'),
            it: require('../../assets/icons/flags/it.png'),
            je: require('../../assets/icons/flags/je.png'),
            jm: require('../../assets/icons/flags/jm.png'),
            jo: require('../../assets/icons/flags/jo.png'),
            jp: require('../../assets/icons/flags/jp.png'),
            ke: require('../../assets/icons/flags/ke.png'),
            kg: require('../../assets/icons/flags/kg.png'),
            kh: require('../../assets/icons/flags/kh.png'),
            ki: require('../../assets/icons/flags/ki.png'),
            km: require('../../assets/icons/flags/km.png'),
            kn: require('../../assets/icons/flags/kn.png'),
            kp: require('../../assets/icons/flags/kp.png'),
            kr: require('../../assets/icons/flags/kr.png'),
            kw: require('../../assets/icons/flags/kw.png'),
            ky: require('../../assets/icons/flags/ky.png'),
            kz: require('../../assets/icons/flags/kz.png'),
            la: require('../../assets/icons/flags/la.png'),
            lb: require('../../assets/icons/flags/lb.png'),
            lc: require('../../assets/icons/flags/lc.png'),
            li: require('../../assets/icons/flags/li.png'),
            lk: require('../../assets/icons/flags/lk.png'),
            lr: require('../../assets/icons/flags/lr.png'),
            ls: require('../../assets/icons/flags/ls.png'),
            lt: require('../../assets/icons/flags/lt.png'),
            lu: require('../../assets/icons/flags/lu.png'),
            lv: require('../../assets/icons/flags/lv.png'),
            ly: require('../../assets/icons/flags/ly.png'),
            ma: require('../../assets/icons/flags/ma.png'),
            mc: require('../../assets/icons/flags/mc.png'),
            md: require('../../assets/icons/flags/md.png'),
            me: require('../../assets/icons/flags/me.png'),
            mf: require('../../assets/icons/flags/mf.png'),
            mg: require('../../assets/icons/flags/mg.png'),
            mh: require('../../assets/icons/flags/mh.png'),
            mk: require('../../assets/icons/flags/mk.png'),
            ml: require('../../assets/icons/flags/ml.png'),
            mm: require('../../assets/icons/flags/mm.png'),
            mn: require('../../assets/icons/flags/mn.png'),
            mo: require('../../assets/icons/flags/mo.png'),
            mp: require('../../assets/icons/flags/mp.png'),
            mq: require('../../assets/icons/flags/mq.png'),
            mr: require('../../assets/icons/flags/mr.png'),
            ms: require('../../assets/icons/flags/ms.png'),
            mt: require('../../assets/icons/flags/mt.png'),
            mu: require('../../assets/icons/flags/mu.png'),
            mv: require('../../assets/icons/flags/mv.png'),
            mw: require('../../assets/icons/flags/mw.png'),
            mx: require('../../assets/icons/flags/mx.png'),
            my: require('../../assets/icons/flags/my.png'),
            mz: require('../../assets/icons/flags/mz.png'),
            na: require('../../assets/icons/flags/na.png'),
            nc: require('../../assets/icons/flags/nc.png'),
            ne: require('../../assets/icons/flags/ne.png'),
            nf: require('../../assets/icons/flags/nf.png'),
            ng: require('../../assets/icons/flags/ng.png'),
            ni: require('../../assets/icons/flags/ni.png'),
            nl: require('../../assets/icons/flags/nl.png'),
            no: require('../../assets/icons/flags/no.png'),
            np: require('../../assets/icons/flags/np.png'),
            nr: require('../../assets/icons/flags/nr.png'),
            nu: require('../../assets/icons/flags/nu.png'),
            nz: require('../../assets/icons/flags/nz.png'),
            om: require('../../assets/icons/flags/om.png'),
            pa: require('../../assets/icons/flags/pa.png'),
            pe: require('../../assets/icons/flags/pe.png'),
            pf: require('../../assets/icons/flags/pf.png'),
            pg: require('../../assets/icons/flags/pg.png'),
            ph: require('../../assets/icons/flags/ph.png'),
            pk: require('../../assets/icons/flags/pk.png'),
            pl: require('../../assets/icons/flags/pl.png'),
            pm: require('../../assets/icons/flags/pm.png'),
            pn: require('../../assets/icons/flags/pn.png'),
            pr: require('../../assets/icons/flags/pr.png'),
            ps: require('../../assets/icons/flags/ps.png'),
            pt: require('../../assets/icons/flags/pt.png'),
            pw: require('../../assets/icons/flags/pw.png'),
            py: require('../../assets/icons/flags/py.png'),
            qa: require('../../assets/icons/flags/qa.png'),
            re: require('../../assets/icons/flags/re.png'),
            ro: require('../../assets/icons/flags/ro.png'),
            rs: require('../../assets/icons/flags/rs.png'),
            ru: require('../../assets/icons/flags/ru.png'),
            rw: require('../../assets/icons/flags/rw.png'),
            sa: require('../../assets/icons/flags/sa.png'),
            sb: require('../../assets/icons/flags/sb.png'),
            sc: require('../../assets/icons/flags/sc.png'),
            sd: require('../../assets/icons/flags/sd.png'),
            se: require('../../assets/icons/flags/se.png'),
            sg: require('../../assets/icons/flags/sg.png'),
            sh: require('../../assets/icons/flags/sh.png'),
            si: require('../../assets/icons/flags/si.png'),
            sj: require('../../assets/icons/flags/sj.png'),
            sk: require('../../assets/icons/flags/sk.png'),
            sl: require('../../assets/icons/flags/sl.png'),
            sm: require('../../assets/icons/flags/sm.png'),
            sn: require('../../assets/icons/flags/sn.png'),
            so: require('../../assets/icons/flags/so.png'),
            sr: require('../../assets/icons/flags/sr.png'),
            ss: require('../../assets/icons/flags/ss.png'),
            st: require('../../assets/icons/flags/st.png'),
            sv: require('../../assets/icons/flags/sv.png'),
            sx: require('../../assets/icons/flags/sx.png'),
            sy: require('../../assets/icons/flags/sy.png'),
            sz: require('../../assets/icons/flags/sz.png'),
            tc: require('../../assets/icons/flags/tc.png'),
            td: require('../../assets/icons/flags/td.png'),
            tf: require('../../assets/icons/flags/tf.png'),
            tg: require('../../assets/icons/flags/tg.png'),
            th: require('../../assets/icons/flags/th.png'),
            tj: require('../../assets/icons/flags/tj.png'),
            tk: require('../../assets/icons/flags/tk.png'),
            tl: require('../../assets/icons/flags/tl.png'),
            tm: require('../../assets/icons/flags/tm.png'),
            tn: require('../../assets/icons/flags/tn.png'),
            to: require('../../assets/icons/flags/to.png'),
            tr: require('../../assets/icons/flags/tr.png'),
            tt: require('../../assets/icons/flags/tt.png'),
            tv: require('../../assets/icons/flags/tv.png'),
            tw: require('../../assets/icons/flags/tw.png'),
            tz: require('../../assets/icons/flags/tz.png'),
            ua: require('../../assets/icons/flags/ua.png'),
            ug: require('../../assets/icons/flags/ug.png'),
            um: require('../../assets/icons/flags/um.png'),
            us: require('../../assets/icons/flags/us.png'),
            uy: require('../../assets/icons/flags/uy.png'),
            uz: require('../../assets/icons/flags/uz.png'),
            va: require('../../assets/icons/flags/va.png'),
            vc: require('../../assets/icons/flags/vc.png'),
            ve: require('../../assets/icons/flags/ve.png'),
            vg: require('../../assets/icons/flags/vg.png'),
            vi: require('../../assets/icons/flags/vi.png'),
            vn: require('../../assets/icons/flags/vn.png'),
            vu: require('../../assets/icons/flags/vu.png'),
            wf: require('../../assets/icons/flags/wf.png'),
            ws: require('../../assets/icons/flags/ws.png'),
            xk: require('../../assets/icons/flags/xk.png'),
            ye: require('../../assets/icons/flags/ye.png'),
            yt: require('../../assets/icons/flags/yt.png'),
            za: require('../../assets/icons/flags/za.png'),
            zm: require('../../assets/icons/flags/zm.png'),
            zw: require('../../assets/icons/flags/zw.png')
        };

        this.setState({
            flags
        });

        this.setState({
            loading: false
        });
    }

    setSelectedValue = async (value: string) => {
        this.setState({
            selectedValue: value,
            loading: true
        });

        // dispatch
        // @ts-ignore
        await this.props.getLeaderboardData(value);

        this.setState({
            loading: false
        });
    };

    render() {
        if (this.state.loading) {
            return (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                    <ActivityIndicator />
                </View>
            );
        }

        const {lang, paginated} = this.props;
        const {pickerItems, selectedValue} = this.state;

        if (
            !paginated.hasOwnProperty('users') ||
            paginated?.users?.length === 0
        ) {
            return (
                <View>
                    <Text>None found</Text>
                </View>
            );
        }

        return (
            <>
                <Header
                    leftContent={
                        <Title
                            color="white"
                            dictionary={`${lang}.leftpage.leaderboard`}
                        />
                    }
                />

                <View style={styles.container}>
                    <Text style={styles.label}>Select Timeframe:</Text>
                    <Picker
                        selectedValue={selectedValue}
                        style={styles.picker}
                        itemStyle={styles.pickerItem}
                        onValueChange={itemValue =>
                            this.setSelectedValue(itemValue)
                        }
                        mode="dropdown">
                        {pickerItems.map(
                            item =>
                                item.visible && (
                                    <Picker.Item
                                        key={item.value}
                                        label={item.label}
                                        value={item.value}
                                    />
                                )
                        )}
                    </Picker>
                </View>

                <FlatList
                    data={paginated.users}
                    keyExtractor={user =>
                        user.rank + user.username || user.rank + user.name
                    }
                    renderItem={({item}) => (
                        <View style={styles.row}>
                            <Text style={styles.rank}>{item.rank}</Text>
                            <Image
                                source={this.state.flags[item.global_flag]}
                                resizeMethod="auto"
                                resizeMode="cover"
                                style={{
                                    height: SCREEN_HEIGHT * 0.02,
                                    width: SCREEN_WIDTH * 0.05
                                }}
                            />
                            <Text style={styles.username}>
                                {item.username || item.name || 'Anon'}
                            </Text>
                            <Text style={styles.xp}>{item.xp} XP</Text>
                        </View>
                    )}
                />
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f7f7f7',
        padding: 10,
        borderRadius: 5,
        marginVertical: 10
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10
    },
    picker: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        height: 50
    },
    pickerItem: {
        backgroundColor: '#f0f0f0',
        height: 50
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    rank: {
        width: 30,
        textAlign: 'center'
    },
    username: {
        flex: 1,
        marginLeft: 10
    },
    xp: {
        marginRight: 10,
        color: 'green'
    }
});

const mapStateToProps = (state: any) => {
    return {
        lang: state.auth.lang,
        paginated: state.leaderboard.paginated
    };
};

export default connect(mapStateToProps, actions)(LeaderboardsScreen);
