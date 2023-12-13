export type TrackObjectType = {
  screen: string;
  event: string;
  properties?: { [key: string]: string };
}

export interface ITrackableComponentProps {
  track?: string | TrackObjectType;
  children: React.ReactNode;
}
