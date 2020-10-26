// types
import { Place } from '../../../types';

export default (address: Place) => {
  const { geometry, ...add } = address as any;
  return {
    ...add,
    location: {
      lat: geometry.location.lat,
      lon: geometry.location.lng,
    },
  };
};
