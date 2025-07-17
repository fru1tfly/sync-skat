
import { renderUserName, handCount, dateDisplay } from "./utils";
import CenterTable from "./CenterTable";
import MediaQuery from "react-responsive";

import cardIcon from "../assets/cards.png";
import { useState } from "react";
import { Modal } from "./Modal";

export const EventData = (props) => {
    const { events, user, join, leave, remove, openModal, allUsers } = props;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState();

    const displayEvents = () => {
        
        return Object.values(events).map(e => {
            const currentEvent = e.players.filter(p => p.username === user?.username).length !== 0;

            return (
                <div className="event-detail" style={{backgroundColor: currentEvent ? '#FFDBBB' : 'inherit'}}
                    onClick={() => {
                        setShowDetailModal(true);
                        setSelectedEventId(e.id);
                    }}
                >
                    <div className="hand-count hand-count-event semi-bold">
                        <img src={cardIcon} alt="Hands" className="hands-icon" />
                        <span className="hand-count-text">{handCount('Event', e.rounds, e.tableSize)}</span>
                    </div>
                    <div className="event-details">
                        <div className="event-name">{e.name}</div>
                        <div className="spacer"></div>
                        <div className="event-info">
                            <div className="event-icon-text">
                                <div className="event-icon-text">
                                    <i className="fa fa-solid fa-users event-icon"></i>
                                    {e.players.length}
                                </div>
                            </div>
                            {e.startDate && !e.startsIn &&
                                <div className="event-icon-text">
                                    <i className="fa fa-solid fa-clock event-icon"></i>
                                    {dateDisplay(e.startDate)}
                                </div>
                            }
                            {e.startDate && e.startsIn &&
                                <div className="event-icon-text">
                                    <i className="fa fa-solid fa-hourglass-half event-icon"></i>
                                    {e.startsIn}
                                </div>
                            }
                        </div>
                    </div>
                </div>
            );
        });
    };

    const modalActions = () => {
        const currentEvent = events[selectedEventId].players.filter(p => p.username === user?.username).length !== 0;
        const host = events[selectedEventId].host.username === user?.username;

        return (
            <div className="event-action-row">
            {currentEvent &&
                <div class="btn-primary btn-negative round-m border-s semi-bold" onClick={() => { leave(selectedEventId); setShowDetailModal(false); }}>Leave</div>
            }

            {!currentEvent &&
                <div class="btn-primary selected round-m border-s semi-bold" onClick={() => { join(selectedEventId, events[selectedEventId].name); setShowDetailModal(false); }}>Join</div>
            }

            {host &&
                <div class="btn-primary btn-negative round-m border-s semi-bold" onClick={() => { remove(selectedEventId); setShowDetailModal(false); }}>Delete</div>
            }
            </div>
        );
    }

    return (
        <CenterTable 
            obj="Event" icon="fa-calendar" 
            empty={Object.keys(events).length === 0} 
            openModal={openModal}
            canCreate={user?.status === 'Online'}
        >
            {displayEvents()}
            {showDetailModal && 
                <Modal closeModal={() => setShowDetailModal(false)}>
                    <div className="form">
                        <div class="title">
                            {events[selectedEventId].name}
                        </div>
                        <div className="flex10">
                            {!events[selectedEventId].public &&
                                <div className="border-s round-m event-pill">
                                    <i className="fa fa-solid fa-lock"></i>
                                    Private
                                </div>
                            }
                            {events[selectedEventId].sync &&
                                <div className="border-s round-m event-pill">
                                    <i className="fa fa-solid fa-rotate"></i>
                                    SyncSkat
                                </div>
                            }
                        </div>
                        <div className="form-row">
                            <div className="form-label">Host</div>
                            <div className="flex10">
                                <div className="circle" style={{width: '20px', height: '20px', border: '3px solid var(--border-primary)'}}>
                                    <img alt={events[selectedEventId].host.username} src={events[selectedEventId].host.profile_pic} width="100%" height="100%"/>
                                </div>
                                <span>{events[selectedEventId].host.username}</span>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-label">Start Time</div>
                            <div>
                                {events[selectedEventId].startDate && !events[selectedEventId].startsIn &&
                                    <div className="event-icon-text">
                                        <i className="fa fa-solid fa-clock event-icon"></i>
                                        {dateDisplay(events[selectedEventId].startDate)}
                                    </div>
                                }
                                {events[selectedEventId].startDate && events[selectedEventId].startsIn &&
                                    <div className="event-icon-text">
                                        <i className="fa fa-solid fa-hourglass-half event-icon"></i>
                                        {events[selectedEventId].startsIn}
                                    </div>
                                }
                                {!events[selectedEventId].startDate && !events[selectedEventId].startsIn &&
                                    <span>Manual</span>
                                }
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-label">Hands</div>
                            <div>{handCount('Event', events[selectedEventId].rounds, events[selectedEventId].tableSize)}</div>
                        </div>
                        <div className="lobby-list-container border-s round-m">
                            <div className="llc-header semi-bold" style={{padding: '10px', textAlign: 'center'}}>
                                <i className="fa fa-solid fa-user-circle"></i> 
                                Players ({events[selectedEventId].players.length})
                            </div>
                            <div className="lobby-list-body modal-table-body">
                                {allUsers(events[selectedEventId].players)}
                            </div>
                        </div>
                        {modalActions()}
                    </div>
                    
                </Modal>
            }
        </CenterTable>
    );
}

export default EventData;