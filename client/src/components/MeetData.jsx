import React, { useContext, useMemo, useState } from 'react';
import '../styles/MeetData.css';
import { SocketContext } from '../context/SocketContext';
import { Link } from 'react-router-dom';

const MeetData = () => {
  const { socket, myMeets = [] } = useContext(SocketContext);
  const [pastMeets, setPastMeets] = useState(false);

  const [editRoomName, setEditRoomName] = useState('');
  const [editMeetDate, setEditMeetDate] = useState('');
  const [editMeetTime, setEditMeetTime] = useState('');

  /* ===============================
     FILTER LOGIC (SAFE & CLEAN)
  =============================== */

  const getMeetDateTime = (meet) => {
    if (
      meet.meetType !== 'scheduled' ||
      !meet.meetDate ||
      !meet.meetTime ||
      meet.meetDate === 'none' ||
      meet.meetTime === 'none'
    ) {
      return null;
    }

    const dt = new Date(`${meet.meetDate}T${meet.meetTime}`);
    return isNaN(dt.getTime()) ? null : dt;
  };


 const upcomingMeets = useMemo(() => {
   return myMeets.filter((meet) => {
     const meetDateTime = getMeetDateTime(meet);
     return meetDateTime && new Date() < meetDateTime;
   });
 }, [myMeets]);

  const pastMeetsData = useMemo(() => {
    return myMeets.filter((meet) => {
      if (meet.meetType === 'instant') return true;

      const meetDateTime = getMeetDateTime(meet);
      return meetDateTime && new Date() > meetDateTime;
    });
  }, [myMeets]);


  /* ===============================
     UI
  =============================== */

  return (
    <div className="myMeets-body">
      {/* NAV */}
      <div className="myMeets-body-nav">
        <ul>
          <li
            style={!pastMeets ? { borderBottom: '2px solid #fff' } : {}}
            onClick={() => setPastMeets(false)}
          >
            Upcoming meetings
          </li>
          <li
            style={pastMeets ? { borderBottom: '2px solid #fff' } : {}}
            onClick={() => setPastMeets(true)}
          >
            Past meetings
          </li>
        </ul>
      </div>

      {/* CONTENT */}
      <div className="myMeets-body-content">
        {!pastMeets ? (
          <div className="upcomming-meet-content">
            {upcomingMeets.length > 0 ? (
              upcomingMeets.map((meet) => {
                const date = new Date(`${meet.meetDate}T${meet.meetTime}`);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');

                return (
                  <React.Fragment key={meet._id}>
                    <div className="upcomming-meet-card">
                      <div className="details-controls">
                        <div className="meet-card-details">
                          <p>
                            Meet: <span>{meet.roomName}</span>
                          </p>
                          <p>
                            Meet ID: <span>{meet._id}</span>
                          </p>
                        </div>

                        <div className="meet-card-controls">
                          <Link to={`/meet/${meet._id}`}>
                            <button className="joinBtn">Join</button>
                          </Link>

                          <button
                            className="editBtn"
                            data-bs-toggle="modal"
                            data-bs-target={`#modal-${meet._id}`}
                            onClick={() => {
                              setEditRoomName(meet.roomName);
                              setEditMeetDate(meet.meetDate);
                              setEditMeetTime(meet.meetTime);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="deleteBtn"
                            onClick={() =>
                              socket.emit('delete-meet', {
                                roomId: meet._id,
                              })
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="meet-card-timings">
                        <h4>Timings</h4>
                        <div className="meet-card-timings-details">
                          <p>
                            Date:{' '}
                            <span>
                              {day}/{month}/{year}
                            </span>
                          </p>
                          <p>
                            Time:{' '}
                            <span>
                              {hours}:{minutes}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* MODAL */}
                    <div
                      className="modal fade"
                      id={`modal-${meet._id}`}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">Edit Meet</h5>
                            <button
                              type="button"
                              className="btn-close"
                              data-bs-dismiss="modal"
                            ></button>
                          </div>

                          <div className="modal-body">
                            <input
                              className="form-control mb-2"
                              value={editRoomName}
                              onChange={(e) => setEditRoomName(e.target.value)}
                            />

                            <input
                              type="date"
                              className="form-control mb-2"
                              value={editMeetDate}
                              onChange={(e) => setEditMeetDate(e.target.value)}
                            />

                            <input
                              type="time"
                              className="form-control"
                              value={editMeetTime}
                              onChange={(e) => setEditMeetTime(e.target.value)}
                            />
                          </div>

                          <div className="modal-footer">
                            <button
                              className="btn btn-secondary"
                              data-bs-dismiss="modal"
                            >
                              Cancel
                            </button>
                            <button
                              className="btn btn-primary"
                              data-bs-dismiss="modal"
                              onClick={() =>
                                socket.emit('update-meet-details', {
                                  roomId: meet._id,
                                  roomName: editRoomName,
                                  newMeetDate: editMeetDate,
                                  newMeetTime: editMeetTime,
                                })
                              }
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            ) : (
              <p>No upcoming meetings</p>
            )}
          </div>
        ) : (
          <div className="past-meet-content">
            {pastMeetsData.length > 0 ? (
              pastMeetsData.map((meet) => (
                <div className="past-meet-card" key={meet._id}>
                  <div className="meet-card-details">
                    <p>
                      Meet: <span>{meet.roomName}</span>
                    </p>
                    <p>
                      Meet ID: <span>{meet._id}</span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p>No past meetings</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetData;
