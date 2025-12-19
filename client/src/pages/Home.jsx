import React, { useContext, useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import '../styles/Home.css';
import { AuthContext } from '../context/authContext';
import { SocketContext } from '../context/SocketContext';
import { CgEnter } from 'react-icons/cg';
import { RiVideoAddFill } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';

import Dropdown from 'react-bootstrap/Dropdown';
import { Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Groups2Icon from '@mui/icons-material/Groups2';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import BoltIcon from '@mui/icons-material/Bolt';

import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';

const Home = () => {
  const [showModal, setShowModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [newMeetDate, setNewMeetDate] = useState('none');
  const [newMeetTime, setNewMeetTime] = useState('none');

  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinRoomError, setJoinRoomError] = useState('');
  const { user, logout } = useContext(AuthContext);
  console.log(user);
  const navigate = useNavigate();

  const handleLogIn = () => {
    navigate('/login');
  };

  const handleLogOut = (e) => {
    debugger; // This will pause execution
    console.log("log out");
    e.preventDefault();
    logout();
};

  const { socket, setMyMeets, newMeetType, setNewMeetType } =
    useContext(SocketContext);

  const userId = localStorage.getItem('userId');
  const userIdString = userId ? userId.toString() : '';

  const handleCreateRoom = () => {
    if (!roomName || !newMeetType) {
      alert('Please enter meet name and type');
      return;
    }

    socket.emit('create-room', {
      userIdString,
      roomName,
      newMeetType,
      newMeetDate,
      newMeetTime,
    });
  };

  const handleJoinRoom = async () => {
    await socket.emit('user-code-join', { roomId: joinRoomId });
    setRoomName('');
  };

  useEffect(() => {
    socket.on('room-exists', ({ roomId }) => {
      navigate(`/meet/${roomId}`);
    });
    socket.on('room-not-exist', () => {
      setJoinRoomId('');
      setJoinRoomError("Room dosen't exist! please try again..");
    });

    socket.emit('fetch-my-meets', { userIdString });
    socket.on('meets-fetched', async ({ myMeets }) => {
      console.log('myMeetsss', myMeets);
      setMyMeets(myMeets);
    });
  }, [socket]);

  const userName = localStorage.getItem('userName')
    ? localStorage.getItem('userName').toString()
    : '';

  return (
    <div className="homePage">
      <div className="homePage-hero">
        <div className="home-header">
          <div className="home-logo">
            <h2>Zoomify</h2>
          </div>

          {!user ? (
            <div className="header-before-login">
              <button onClick={handleLogIn}>login</button>
            </div>
          ) : (
            <div className="header-after-login">
              <Dropdown>
                <Dropdown.Toggle id="dropdown-basic">
                  {userName}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item
                    as={Link}
                    to="/profile"
                    className="dropdown-options"
                  >
                    {/* <Link className="dropdown-options" to="/profile"> */}
                    Profile
                    {/* </Link> */}
                  </Dropdown.Item>
                  <Dropdown.Item
                    className="dropdown-options"
                    onClick={handleLogOut}
                  >
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          )}
        </div>

        <div className="home-container container">
          {!userName || userName === 'null' ? (
            <div className="home-app-intro">
              {/* <span className="welcome">Welcome!!</span> */}
              <h2>
                Unbounded <b> Connections: </b> Elevate Your Meetings with Free,
                Future-Forward <b> Video Conferencing!! </b>
              </h2>
              <p>
                Revolutionize your meetings with our cutting-edge,
                future-forward video conferencing platform. Experience seamless
                collaboration, crystal-clear audio, and HD video, all at{' '}
                <b> zero-cost..!!</b> Elevate your virtual communication and
                connect without boundaries today!
              </p>
              <button onClick={handleLogIn}>Join Now..</button>
            </div>
          ) : (
            <>
              <div className="home-app-intro">
                <span className="welcome">Welcome!! {userName},</span>
                <h2>
                  Unbounded Connections: Elevate Your Meetings with Free,
                  Future-Forward Video Conferencing!!
                </h2>
              </div>
              <div className="home-meet-container">
                <div className="create-meet">
                  <input
                    type="text"
                    placeholder="Name your meet..."
                    onChange={(e) => setRoomName(e.target.value)}
                  />
                  <button
                    onClick={() => setShowModal(true)}
                  >
                    <RiVideoAddFill /> New meet
                  </button>
                </div>
                <p>or</p>
                <div className="join-meet">
                  <input
                    type="text"
                    placeholder="Enter code..."
                    onChange={(e) => setJoinRoomId(e.target.value)}
                  />
                  <button onClick={handleJoinRoom}>
                    {' '}
                    <CgEnter /> Join Meet
                  </button>
                </div>
                <span>{joinRoomError}</span>
              </div>

              {/* Modal */}
              {/* <div
                class="modal fade"
                id="staticBackdrop"
                data-bs-backdrop="static"
                data-bs-keyboard="false"
                tabindex={-1}
                aria-labelledby="staticBackdropLabel"
                aria-hidden="true"
              >
                <div
                  class="modal-dialog modal-dialog-centered"
                  style={{ width: '30vw' }}
                >
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title" id="staticBackdropLabel">
                        Create New Meet
                      </h5>
                      <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                      ></button>
                    </div>
                    <div class="modal-body">
                       <input type='text' class="form-control" placeholder='Name your meet' value={roomName} onChange={(e)=> setRoomName(e.target.value)}  />
                      <div class="form-floating mb-3 ">
                        <input
                          type="text"
                          class="form-control"
                          id="floatingInput"
                          placeholder="Name your meet"
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                        />
                        <label for="floatingInput">Meet name</label>
                      </div>

                      <select
                        class="form-select"
                        aria-label="Default select example"
                        onChange={(e) => setNewMeetType(e.target.value)}
                      >
                        <option selected>Choose meet type</option>
                        <option value="instant">Instant meet</option>
                        <option value="scheduled">Schedule for later</option>
                      </select>

                      {newMeetType === 'scheduled' ? (
                        <>
                          <p
                            style={{
                              margin: ' 10px 0px 0px 0px',
                              color: 'rgb(2, 34, 58)',
                            }}
                          >
                            Meet Date:{' '}
                          </p>
                          <input
                            type="date"
                            class="form-control"
                            onChange={(e) => setNewMeetDate(e.target.value)}
                          />
                          <p
                            style={{
                              margin: ' 10px 0px 0px 0px',
                              color: 'rgb(2, 34, 58)',
                            }}
                          >
                            Meet Time:{' '}
                          </p>
                          <input
                            type="time"
                            class="form-control"
                            onChange={(e) => setNewMeetTime(e.target.value)}
                          />
                        </>
                      ) : (
                        ''
                      )}
                    </div>
                    <div class="modal-footer">
                      <button
                        type="button"
                        class="btn btn-secondary"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="btn btn-primary"
                        onClick={handleCreateRoom}
                        data-bs-dismiss="modal"
                      >
                        Create meet
                      </button>
                    </div>
                  </div>
                </div>
              </div> */}
              {/* Modal */}
              {/* <div
                className="modal fade"
                id="staticBackdrop"
                data-bs-backdrop="static"
                data-bs-keyboard="false"
                tabIndex={-1}
                aria-labelledby="staticBackdropLabel"
                aria-hidden="true"
              >
                <div
                  className="modal-dialog modal-dialog-centered"
                  style={{ width: '30vw' }}
                >
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title" id="staticBackdropLabel">
                        Create New Meet
                      </h5>
                      <button
                        type="button"
                        className="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                      ></button>
                    </div>
                    <div className="modal-body">
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          id="floatingInput"
                          placeholder="Name your meet"
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                        />
                        <label htmlFor="floatingInput">Meet name</label>
                      </div>

                      <select
                        className="form-select"
                        aria-label="Default select example"
                        onChange={(e) => setNewMeetType(e.target.value)}
                      >
                        <option>Choose meet type</option>
                        <option value="instant">Instant meet</option>
                        <option value="scheduled">Schedule for later</option>
                      </select>

                      {newMeetType === 'scheduled' && (
                        <>
                          <p
                            style={{
                              margin: '10px 0px 0px 0px',
                              color: 'rgb(2, 34, 58)',
                            }}
                          >
                            Meet Date:{' '}
                          </p>
                          <input
                            type="date"
                            className="form-control"
                            onChange={(e) => setNewMeetDate(e.target.value)}
                          />
                          <p
                            style={{
                              margin: '10px 0px 0px 0px',
                              color: 'rgb(2, 34, 58)',
                            }}
                          >
                            Meet Time:{' '}
                          </p>
                          <input
                            type="time"
                            className="form-control"
                            onChange={(e) => setNewMeetTime(e.target.value)}
                          />
                        </>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleCreateRoom}
                        data-bs-dismiss="modal"
                      >
                        Create meet
                      </button>
                    </div>
                  </div>
                </div>
              </div> */}
              {/* Modal */}
              <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
              >
                <Modal.Header closeButton>
                  <Modal.Title>Create New Meet</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="floatingInput"
                      placeholder="Name your meet"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                    />
                    <label htmlFor="floatingInput">Meet name</label>
                  </div>

                  <select
                    className="form-select"
                    aria-label="Default select example"
                    onChange={(e) => setNewMeetType(e.target.value)}
                    value={newMeetType}
                  >
                    <option value="">Choose meet type</option>
                    <option value="instant">Instant meet</option>
                    <option value="scheduled">Schedule for later</option>
                  </select>

                  {newMeetType === 'scheduled' && (
                    <>
                      <p
                        style={{
                          margin: '10px 0px 0px 0px',
                          color: 'rgb(2, 34, 58)',
                        }}
                      >
                        Meet Date:
                      </p>
                      <input
                        type="date"
                        className="form-control"
                        onChange={(e) => setNewMeetDate(e.target.value)}
                      />
                      <p
                        style={{
                          margin: '10px 0px 0px 0px',
                          color: 'rgb(2, 34, 58)',
                        }}
                      >
                        Meet Time:
                      </p>
                      <input
                        type="time"
                        className="form-control"
                        onChange={(e) => setNewMeetTime(e.target.value)}
                      />
                    </>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      handleCreateRoom();
                      setShowModal(false);
                    }}
                  >
                    Create meet
                  </Button>
                </Modal.Footer>
              </Modal>
            </>
          )}
        </div>
      </div>

      <div className="about-app-container">
        <div className="box">
          <div className="box-inner">
            <div className="box-front">
              <h2>Connect Anytime, Anywhere!</h2>
              <p>
                Our video conference app brings people closer with easy
                connectivity and affordability. Experience seamless virtual
                meetings, collaborate effortlessly, and stay connected across
                the globe.
              </p>
            </div>

            <div className="box-back">
              <h2>Your Passport to Seamless Communication!</h2>
              <p>
                Unlock the world of effortless connectivity with our video
                conference app. Stay connected with colleagues, friends, and
                family—anytime, anywhere.
              </p>
            </div>
          </div>
        </div>

        <div className="about-cards">
          <Card className="about-card-body">
            <Card.Body>
              <Card.Title className="about-card-title">
                <span>
                  {' '}
                  <Groups2Icon />{' '}
                </span>
              </Card.Title>
              <Card.Text className="about-card-text">
                Easy Group Conference!! Bringing chaos to order, one virtual
                group hug at a time!
              </Card.Text>
            </Card.Body>
          </Card>
          <Card className="about-card-body">
            <Card.Body>
              <Card.Title className="about-card-title">
                <span>
                  {' '}
                  <CalendarMonthIcon />{' '}
                </span>
              </Card.Title>
              <Card.Text className="about-card-text">
                Schedule Meets Any Time!! Time is no longer the boss, you are!!
              </Card.Text>
            </Card.Body>
          </Card>
          <Card className="about-card-body">
            <Card.Body>
              <Card.Title className="about-card-title">
                {' '}
                <span>
                  {' '}
                  <CurrencyRupeeIcon />{' '}
                </span>
              </Card.Title>
              <Card.Text className="about-card-text">
                Free of Cost!! Saving you moolah and keeping your pockets jolly.
                High fives for freebies!
              </Card.Text>
            </Card.Body>
          </Card>
          <Card className="about-card-body">
            <Card.Body>
              <Card.Title className="about-card-title">
                <span>
                  {' '}
                  <StopCircleIcon />{' '}
                </span>
              </Card.Title>
              <Card.Text className="about-card-text">
                Preserving valuable discussions and insights, enabling you to
                revisit and learn from every meeting.
              </Card.Text>
            </Card.Body>
          </Card>
          <Card className="about-card-body">
            <Card.Body>
              <Card.Title className="about-card-title">
                <span>
                  {' '}
                  <QuestionAnswerIcon />{' '}
                </span>
              </Card.Title>
              <Card.Text className="about-card-text">
                In-Meet Chat Feature!! Facilitating seamless communication
                within meetings, fostering real-time collaboration and
                engagement!!
              </Card.Text>
            </Card.Body>
          </Card>
          <Card className="about-card-body">
            <Card.Body>
              <Card.Title className="about-card-title">
                <span>
                  {' '}
                  <BoltIcon />{' '}
                </span>
              </Card.Title>
              <Card.Text className="about-card-text">
                Zooming through virtual space like a rocket-powered cheetah.
                Efficiently connecting dots, one meet at a time!
              </Card.Text>
            </Card.Body>
          </Card>
        </div>
      </div>

      <div className="footer">
        <h2>Contact us @: </h2>
        <div className="footer-social-media">
          <GoogleIcon />
          <FacebookIcon />
          <InstagramIcon />
          <TwitterIcon />
        </div>
      </div>
    </div>
  );
};

export default Home;
