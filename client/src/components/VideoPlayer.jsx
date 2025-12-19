import { AgoraVideoPlayer } from 'agora-rtc-react';
import { SocketContext } from '../context/SocketContext';
import { useContext } from 'react';

export default function Video(props) {
  const { users, tracks, participants, screenTrack } =
    useContext(SocketContext);

  return (
    <div className="videoPlayer-page">
      {/* Your own video */}
      <div
        className={`videoplayer-video ${
          screenTrack === tracks[1] ? 'screen-sharing-active' : ''
        }`}
        style={
          users.length < 1
            ? { height: '72vh', width: '60vw' }
            : users.length === 1
            ? { height: '65vh', width: '45vw' }
            : {}
        }
      >
        <AgoraVideoPlayer
          id="video"
          videoTrack={tracks[1]}
          style={
            users.length < 1
              ? { height: '71vh', width: '60vw' }
              : users.length === 1
              ? { height: '64vh', width: '45vw' }
              : {}
          }
        />
        <p>You</p>
      </div>

      {/* Other users */}
      {users.length > 0 &&
        users.map((user) => {
          if (user.videoTrack) {
            const isScreenSharing =
              screenTrack && user.videoTrack === screenTrack;

            return (
              <div
                className={`videoplayer-video ${
                  isScreenSharing ? 'screen-sharing-active' : ''
                }`}
                style={
                  users.length === 1 ? { height: '65vh', width: '50vw' } : {}
                }
                key={user.uid}
              >
                <AgoraVideoPlayer
                  id="video"
                  videoTrack={user.videoTrack}
                  style={
                    users.length === 1 ? { height: '64vh', width: '45vw' } : {}
                  }
                />
                <p>{participants[user.uid]}</p>
              </div>
            );
          } else return null;
        })}
    </div>
  );
}
