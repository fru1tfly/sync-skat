
import { renderUserName } from "./utils";
import CenterTable from "./CenterTable";
import cardIcon from "../assets/cards.png";


const PLAYER_SLOTS_X = ['25%', '75%', '75%', '25%'];
const PLAYER_SLOTS_Y = ['39%', '39%', '82%', '82%'];

export const TableData = (props) => {
    const { tables, user, join, leave, openModal } = props;

    const displayTables = () => {
        return Object.values(tables).map(t => (
            <div className="table-card border-m round-xl">
                <div className="hand-count hand-count-table semi-bold">
                    <img src={cardIcon} alt="Hands" className="hands-icon" />
                    <span className="hand-count-text">{t.rounds * t.tableSize}</span>
                </div>
                <div className="table-leg" style={{top: 'calc(100% - 80px)', left: '22%'}}></div>
                <div className="table-leg table-leg-left" style={{top: 'calc(100% - 80px)', left: '68%'}}></div>
                <div className="table-card-table table-card-table-bottom"></div>
                <div className="table-card-table-middle"></div>
                <div className="table-card-table"></div>
                {t.players.map((p, ind) => (
                    <div className="table-slot" style={{
                        top: PLAYER_SLOTS_Y[ind],
                        left: ind === 2 && t.players.length === 3 ? '50%' : PLAYER_SLOTS_X[ind],
                        transform: 'translate(-50%, -50%)'
                    }}>
                        {p.username && 
                            <>
                            <div className="user-text">{p.username}</div>
                                <img 
                                    alt={p?.username} 
                                    src={p?.profile_pic} 
                                    width="42px" height="42px"
                                    className="circle" 
                                    style={{border: `4px solid ${
                                        p?.username === user?.username ?
                                        '#FF9020' :
                                        'var(--border-primary)'
                                    }`}} 
                                    onClick={() => {
                                        if(user.status === 'TableWaiting' && p.username === user.username) {
                                            console.log('i oiut');
                                            leave(t.id);
                                        }
                                    }}
                                />
                            </>
                        }
                        {!p.username &&
                            <div className="table-slot-open circle" onClick={() => {
                                if(user.status === 'Online') {
                                    join(t.id, ind);
                                }
                            }}></div>
                        }
                    </div>
                ))}
                {!t.public && 
                    <i className="fa fa-solid fa-unlock-keyhole table-key-icon"></i>
                }
            </div>
        ));
    };

    return (
        <CenterTable 
            obj="Table" 
            icon="fa-layer-group" 
            empty={Object.keys(tables).length === 0} 
            openModal={openModal}
            canCreate={user?.status === 'Online'}
        >
            <div className="table-card-container">
                {displayTables()}
            </div>
        </CenterTable>
    );
}

export default TableData;