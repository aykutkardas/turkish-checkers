import { useEffect, useState } from "preact/hooks";
import { Checkers, Utils } from "ymir-js";
import { Howl } from "howler";

const { Board } = Checkers.Turkish;
const { useCoord } = Utils;

import style from "./index.css";

function toBoolean(val) {
  return val === "true";
}

const board = new Board();

const WoodHardHitVoice = new Howl({
  src: ["/assets/voices/wood-hard-hit.wav"],
});

const MoveSound = new Howl({
  src: ["/assets/voices/move-sound.mp3"],
});

const KnifeThrust = new Howl({
  src: ["/assets/voices/knife-thrust-into-wall.mp3"],
});

const App = () => {
  const [turn, setTurn] = useState(0);
  const [activeColor, setActiveColor] = useState("black");

  const [activeItem, setActiveItem] = useState(null);
  const [activeCoord, setActiveCoord] = useState(null);
  const [boardMatrix, setBoardMatrix] = useState(board.getBoardMatrix());
  const [availableColumns, setAvailableColumns] = useState([]);

  useEffect(() => {
    board.init();
    setBoardMatrix(board.getBoardMatrix());
    console.log(board);
  }, []);

  useEffect(() => {
    if (!activeItem || !activeCoord) {
      setAvailableColumns([]);
    } else {
      const { movement } = activeItem;
      const columns = board.getAvailableColumns(activeCoord, movement);
      setAvailableColumns(columns);
    }
  }, [activeItem, activeCoord]);

  const selectItem = ({ target }) => {
    const { coord } = target.dataset;
    const activeItem = board.getItem(coord);

    const successMoves =
      board.analyzeBoardForAvailableSuccessMoves(activeColor);

    if (successMoves.length && !successMoves.includes(coord)) {
      selectItem({ target: { dataset: { coord: successMoves[0] } } });
      return;
    }

    if (activeItem?.color !== activeColor) return;

    setActiveItem(activeItem);

    board.deselectAllItems();
    board.selectItem(coord);

    setActiveCoord(coord);
    WoodHardHitVoice.play();
  };

  const moveItem = ({ target }) => {
    const { coord, available } = target.dataset;

    if (!toBoolean(available)) return;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [toRowId] = useCoord(coord);

    if (toRowId === 0 || toRowId === 7) {
      activeItem.setKing();
    }

    const coordsOfDestoryItems = board.getItemsBetweenTwoCoords(
      activeCoord,
      coord
    );

    const destroyedAnyItemsThisTurn = coordsOfDestoryItems.length > 0;

    board.moveItem(activeCoord, coord);

    if (destroyedAnyItemsThisTurn) {
      coordsOfDestoryItems.forEach((coord) => {
        KnifeThrust.play();
        board.removeItem(coord);
      });
    }

    board.deselectAllItems();
    setBoardMatrix(board.getBoardMatrix());
    setActiveCoord(coord);

    const successMoves =
      board.analyzeBoardForAvailableSuccessMoves(activeColor);

    if (
      !destroyedAnyItemsThisTurn ||
      (destroyedAnyItemsThisTurn && !successMoves.length)
    ) {
      setActiveColor(activeColor === "white" ? "black" : "white");
      setTurn(turn + 1);
      setActiveItem(null);
      MoveSound.play();
    } else {
      board.selectItem(coord);

      board.getAvailableColumns(coord, board.getItem(coord).movement);
    }
  };

  return (
    <div className={style.board}>
      {turn}
      {boardMatrix.map((row) => (
        <div key={row} class={style.row}>
          {row.map(({ coord, item }) => (
            <div
              key={coord}
              className={style.column}
              data-coord={coord}
              data-available={availableColumns.includes(coord)}
              onClick={moveItem}
            >
              {item && (
                <div
                  className={`${style.item} ${
                    item.color === "black" ? style.black : style.white
                  }`}
                  onClick={selectItem}
                  data-coord={coord}
                  data-color={item.color}
                  data-selected={item.selected}
                  data-king={item.king}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default App;
