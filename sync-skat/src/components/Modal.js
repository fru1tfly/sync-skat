export const Modal = (props) => {
    const { children, closeModal, style } = props;
    return (
        <div className="modal-background">
            <div className="regular border-l round-xl modal centered" style={style}>
                <button className="close-modal-btn" onClick={closeModal}>
                    <i className="fa fa-solid fa-close"></i>
                </button>
                {children}
            </div>
        </div>
    );
}