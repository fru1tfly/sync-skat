export const CenterTable = (props) => {
    const { obj, icon, empty, children, openModal, canCreate } = props;

    return (
        <>
            <div className="lobby-center-title semi-bold title">
                <span><i className={`fa fa-solid ${icon} lobby-icon`}></i>{obj}s</span>
                {canCreate && 
                    <div onClick={() => openModal(obj)} className="border-s round-l btn-primary">New {obj}</div>
                }
            </div>
            <div className="lobby-list-container border-m round-l regular">
                {!empty && 
                    <>{children}</>
                }
                {empty &&
                    <div className="lobby-list-none-message">
                        No active {obj}s. <br/>Select 'New {obj}' to start one!
                    </div>
                }
            </div>
        </>
    );
}

export default CenterTable;