import React, { useCallback, useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Icon, divIcon, point } from "leaflet";
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Button, createTheme, OutlinedInput, Theme, ThemeProvider } from "@mui/material";
import styled from "styled-components";
import "leaflet/dist/leaflet.css";

const Container = styled.div`    
    display:flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 100%;
    width: 100%;
    border-radius: 15px;
    gap: 10px;
    box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;`;
const ContainerMap = styled.div`
    display:flex;
    justify-content: center;
    align-items: flex-start;
    flex-direction: row;
    height: 100%;
    width: 100%;
    gap: 5px;`;
const PointsList = styled.div`    
    width: 100%;
    height: 100%;
    overflow-y: scroll;`;
const SidebarContainer = styled.div`
    padding: 10px;
    width: 400px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;`;
const PointContainer = styled.div`
    border-radius: 10px;
    background-color: white;
    padding: 20px;
    display: flex;
    align-items: center;
    flex-direction: column;
    margin-bottom: 10px;
    margin-top: 10px;
    margin-left: 5px;
    margin-right: 5px;
    border-radius: 10px;
    box-shadow: rgba(50, 50, 105, 0.15) 0px 2px 5px 0px, rgba(0, 0, 0, 0.05) 0px 1px 1px 0px;`;
const Title = styled.div`
    gap:5px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: large;
    text-align: center;`;
const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding-top: 10px;
    padding-bottom: 10px;`;
const Service = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;`;
const Name = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;`;
const Description = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;`;
const StyledIcon = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;`;
const StyledIconImg = styled.img`
    max-width: 75px;
    max-height: 75px;`;
const PointDetails = styled.div`
    display:flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 10px;
    flex-direction: column;`;

const PointService = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PointName = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PointDescription = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PointIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PointIconImage = styled.img`
  max-width: 150px;
  max-height: 150px;
`;

const LocationInput = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  width: 100%;`;

const ClusterIconStyle = `
  background-color: #f81515;
  height: 2em;
  width: 2em;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1.2rem;
  box-shadow: 0 0 0px 5px #fff;`;

const ButtonText = styled.div`
  text-align: center;`;
  

interface InputWindowProps {
  baseMapPosition?: Position,
  zoom?: number,
  theme?: Theme,
  handleSelection: (input: MapPoint) => any,
  getPoints: (position: Position, bounds: Bounds) => MapPoint[],
  findLocation: (searchPhrase: string) => Position
};

interface MapPoint {
  key: string,
  type: string,
  name: string,
  description: string,
  service: string,
  geocode: [number, number]
};

interface Bounds {
  northEast: Position,
  southWest: Position
}

interface Position {
  latitude: number,
  longitude: number
}

const LeafletMap: React.FC<InputWindowProps> = ({
  baseMapPosition = { latitude: 52.22, longitude: 21.02 },
  zoom = 13,
  theme = createTheme({
    palette: {
      primary: {
        main: 'rgb(106,24,19)',
      },
      secondary: {
        main: 'rgb(218, 207, 185)'
      }
    },
    typography: {
      fontFamily: "Ysabeau",
      h6: {
        wordWrap: "break-word",
      },
      h5: {
        wordWrap: "break-word",
      },
      h4: {
        wordWrap: "break-word",
      },
      body1: {
        wordWrap: "break-word",
      },
      body2: {
        wordWrap: "break-word",
      }
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "20px"
          }
        }
      }
    }
  }),
  handleSelection,
  getPoints,
  findLocation
}) => {
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [map, setMap] = useState<any>();
  const [selectedPoint, setSelectedPoint] = useState<MapPoint>(null!);
  const [position, setPosition] = useState<Position>(baseMapPosition);
  const [bounds, setBounds] = useState<Bounds>(null!);
  const [zoomState, setZoomState] = useState(zoom);
  const [searchPhrase, setSearchPhrase] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const onMove = useCallback(() => {
    if (map) {
      let pos = map?.getCenter();
      let bounds = map?.getBounds();
      if (pos) {
        setPosition({
          latitude: pos.lat,
          longitude: pos.lng
        } as Position);
      }
      if (bounds) {
        setBounds({
          northEast: {
            latitude: bounds.getNorthEast().lat,
            longitude: bounds.getNorthEast().lng
          } as Position,
          southWest: {
            latitude: bounds.getSouthWest().lat,
            longitude: bounds.getSouthWest().lng
          } as Position
        } as Bounds
        );
      }
      setZoomState(map.getZoom());
    }
  }, [map])

  const setMapPosition = (point: MapPoint) => {
    if (map)
      map.setView(point.geocode, zoomState);
  }

  useEffect(() => {
    if (map) {
      map.on('move', onMove)
      return () => {
        map.off('move', onMove)
      }
    }
    return () => {};
  }, [map, onMove])

  useEffect(() => {
    let waitTime = position === baseMapPosition ? 0 : 500;

    if (position) {
      timerRef.current = setTimeout(() => {
        let points = getPoints(position, bounds);
        setMapPoints(points);
      }, waitTime);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };

  }, [position])

  const getcustomIcon = (marker: MapPoint) => {
    return new Icon({
      iconUrl: selectedPoint && selectedPoint.key === marker.key ? require("./marker-selected.png") : require("./marker.png"),
      iconSize: [32, 32]
    })
  };

  const createClusterCustomIcon = (cluster: any) => {
    return divIcon({
      html: `<span class="cluster-icon" style="${ClusterIconStyle}">${cluster.getChildCount()}</span>`,
      className: "custom-marker-cluster",
      iconSize: point(20, 20, true)
    });
  };

  const handleSelectMarker = (point: MapPoint) => {
    setSelectedPoint(point);
    setMapPosition(point);
  }

  const handleDeselectMarker = () => {
    setSelectedPoint(null!);
  }

  const handleSearchLocation = () => {
    if (searchPhrase && searchPhrase !== '') {
      const response = findLocation(searchPhrase);
      setPosition(response);
    }
  }

  let displayDetails = () => {
    return <>
      <Button
        onClick={() => handleDeselectMarker()}
        aria-label="back"
        startIcon={<ArrowBackIcon />}
      >
        <ButtonText> Powrót </ButtonText>
      </Button>

      <PointDetails>
        <PointIcon><PointIconImage src='/images/inpost-logo.jpg'></PointIconImage></PointIcon>
        <PointService>{selectedPoint.service}</PointService>
        <PointName>{selectedPoint.name}</PointName>
        <PointDescription>{selectedPoint.description}</PointDescription>
        <Button
          onClick={() => handleSelection(selectedPoint)}
          variant='contained'>
          <ButtonText> Zatwierdź punkt </ButtonText>
        </Button>
      </PointDetails>
    </>
  }

  let displayList = () => {

    return <><LocationInput>
      <OutlinedInput
        fullWidth
        placeholder="Adres"
        sx={{
          borderRadius: "40px"
        }}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setSearchPhrase(event.target.value);
        }}
      />
      <IconButton onClick={() => handleSearchLocation()} aria-label="back">
        <ArrowForwardIcon />
      </IconButton>
    </LocationInput>
      <PointsList>
        {mapPoints.map((point) => {
          return <PointContainer>
            <Title>
              <StyledIcon><StyledIconImg src='/images/inpost-logo.jpg'></StyledIconImg></StyledIcon>
              <Service>{point.service}</Service>
            </Title>
            <Content>
              <Name>{point.name}</Name>
              <Description>{point.description}</Description>
            </Content>
            <Button
              onClick={() => handleSelectMarker(point)} variant='contained'>
              <ButtonText> Wybierz punkt </ButtonText>
            </Button>
          </PointContainer>
        })}
        </PointsList></>
  }

  return <ThemeProvider theme={theme}>
    <Container>
      <ContainerMap>
        <MapContainer
          center={{lat: baseMapPosition.latitude, lng: baseMapPosition.longitude}}
          zoom={zoom}
          ref={setMap}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
          >
            {mapPoints.map((marker) => (
              <Marker position={marker.geocode} icon={getcustomIcon(marker)} eventHandlers={{
                click: () => {
                  handleSelectMarker(marker)
                },
              }} />
            ))}
          </MarkerClusterGroup>
        </MapContainer>
        <SidebarContainer>
          {selectedPoint ? displayDetails() : displayList()}
        </SidebarContainer>
      </ContainerMap>
    </Container>
  </ThemeProvider>
}

LeafletMap.defaultProps = {
  
}

export default LeafletMap;