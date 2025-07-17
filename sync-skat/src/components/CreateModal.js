import { Modal } from "./Modal";
import { useState, useContext } from "react";
import FormValueToggle from "./FormValueToggle";
import { socket } from "./socket";
import { handCount } from "./utils";
import { UserContext } from "../UserContext";
import MediaQuery from "react-responsive";

export const CreateModal = (props) => {
    const { createType, closeModal } = props;
    
    const userInfo = useContext(UserContext);
    const [eventName, setEventName] = useState('');
    const [password, setPassword] = useState('');
    const [privacy, setPrivacy] = useState('Public');
    const [startMethod, setStartMethod] = useState('Manual');
    const [startDate, setStartDate] = useState('');
    const [tableSize, setTableSize] = useState(3);
    const [rounds, setRounds] = useState(12);
    const [sync, setSync] = useState(false);
    const [joinAsPlayer, setJoinAsPlayer] = useState(true);


    const canCreate = () => {
        if(createType !== 'Table' && eventName === '') return false;
        if(privacy === 'Private' && password === '') return false;
        if(startMethod === 'Scheduled' && startDate === '') return false;
        if(timeTooEarly) return false;

        return true;
    }

    const createGroup = () => {
        if(!canCreate()) return;

        const createBody = {
            type: createType,
            name: eventName,
            public: privacy === 'Public',
            password: password,
            tableSize: tableSize,
            rounds: rounds,
            sync: sync,
            startMethod: startMethod,
            startDate: new Date(startDate),
            joinAsPlayer: joinAsPlayer,
            username: userInfo.username,
            img: userInfo.profile_pic,
            country: userInfo.country
        };

        socket.emit('create-group', createBody);

        closeModal();
    }

    const timeTooEarly = new Date(startDate).getTime() < new Date().getTime() + 600000;

    return (
        <Modal closeModal={closeModal}>
            <div className="form">
                <div className="title semi-bold" style={{textAlign: 'center'}}>Create {createType}</div>
                {createType === 'Event' &&
                    <input className="form-input border-s round-m regular" type="text" placeholder="Event Name" value={eventName} onChange={(e) => setEventName(e.currentTarget.value)} />
                }
                <FormValueToggle 
                    title="Privacy" 
                    option1="Public" option2="Private" 
                    value={privacy}
                    updateValue={setPrivacy} 
                />
                {privacy === 'Private' &&
                    <>
                        <span className="help-text">Provide a password for users to enter when requesting to join the {createType}</span>
                        <input className="form-input border-s round-m regular" type="text" placeholder="Password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
                    </>
                }
                <FormValueToggle 
                    title={createType === 'Event' ? 'Preferred Table Size' : 'Table Size'} 
                    option1={3} option2={4} 
                    value={tableSize}
                    updateValue={setTableSize} 
                />
                {createType === 'Event' && 
                    <span className="help-text">Players will be assigned to as many {tableSize} tables as possible and the rest will be assigned to {tableSize === 3 ? 4 : 3} tables.</span>
                }
                <MediaQuery query="(min-width: 601px)">
                    <div className="form-row">
                        <div className="form-label">Hands</div>
                        <div className="hands-range">
                            <div style={{width: createType === 'Table' ? '50px' : '80px'}} 
                                className="hands-range-counter selected border-s round-m bold" 
                            >
                                    {handCount(createType, rounds, tableSize)}
                            </div>
                            <div className="range-container">
                                <div class="range" style={{"--step":1, "--min":1, "--max":12}}>
                                    <input type="range" min="1" max="12" step="1" value={rounds}
                                    onChange={(e) => setRounds(e.currentTarget.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </MediaQuery>
                <MediaQuery query="(max-width: 600px)">
                    <div className="form-row">
                        <div className="form-label">Hands</div>
                        <div style={{width: createType === 'Table' ? '50px' : '80px'}} 
                            className="hands-range-counter selected border-s round-m bold" 
                        >
                                {handCount(createType, rounds, tableSize)}
                        </div>
                    </div>
                    <div>
                        <div className="range-container">
                            <div class="range" style={{"--step":1, "--min":1, "--max":12}}>
                                <input type="range" min="1" max="12" step="1" value={rounds}
                                onChange={(e) => setRounds(e.currentTarget.value)} />
                            </div>
                        </div>
                    </div>
                </MediaQuery>
                {createType === 'Event' && 
                    <>
                        <FormValueToggle 
                            title="Start Method" 
                            option1="Manual" option2="Scheduled"
                            value={startMethod}

                            updateValue={setStartMethod} 
                        />
                        {startMethod === 'Scheduled' && 
                            <>
                                <input className="form-input border-s round-m regular" 
                                type="datetime-local" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.currentTarget.value)}
                                min={new Date().toISOString().slice(0, 16)}/>
                                {timeTooEarly && 
                                    <div className="help-text">Set your start time at least 10 minutes from now to give players time to join<br/><br/>If you'd like to start your event sooner, use a manual start</div>
                                }
                            </>
                        }
                        <div className="form-row">
                            <label className="form-checkbox-row">
                                <input type="checkbox" onChange={(e) => setSync(e.currentTarget.checked)}/>
                                <span className="check border-s round-m"></span>
                                <span className="checkbox-label">SyncSkat</span>
                            </label>
                        </div>
                        {sync && (
                            <div className="help-text">
                                The game mode that gave SyncSkat its name! All tables will be dealt the same cards each hand.<br/><br/>
                                A round of SyncSkat cannot start until the number of players reaches a multiple of the table size.
                            </div>
                        )}
                        <div className="form-row">
                            <label className="form-checkbox-row">
                                <input type="checkbox" onChange={(e) => setJoinAsPlayer(e.currentTarget.checked)} checked={joinAsPlayer}/>
                                <span className="check border-s round-m"></span>
                                <span className="checkbox-label">Join As Player</span>
                            </label>
                        </div>
                    </>
                }
                <div className="form-row center-flex">
                    <div onClick={createGroup} className={`btn-primary btn-group-btn border-s round-l bold title ${canCreate() ? 'selected' : ''}`}>Create</div>
                </div>
            </div>
        </Modal>
    );
}

export default CreateModal;