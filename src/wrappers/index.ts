import React, { useEffect } from 'react';
import { sendCustomEvent, sendScreenEvent } from '../dispatchers';
import { ITrackableComponentProps, TrackObjectType } from './wrapper.types';

const isTrackObject = (track: string | TrackObjectType): track is TrackObjectType => typeof track !== 'string' && 'screen' in track && 'event' in track;

const TrackableComponent: React.FC<ITrackableComponentProps> = ({ track, children }) => {
  useEffect(() => {
    if (track && isTrackObject(track)) {
      const { event, properties = {} } = track;
      sendCustomEvent(event, properties);
    } else if (typeof track === 'string') {
      sendScreenEvent(track);
    }
  }, [track]);

  return children;
};

export default TrackableComponent;
