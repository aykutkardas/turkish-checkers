import { useEffect, useState } from "preact/hooks";
import { Checkers, Utils } from "ymir-js";

const { Board } = Checkers.Turkish;
const { useCoord } = Utils;

import { toBoolean, getVoice } from "../../utils";

import style from "./board.css";

const board = new Board();

const App = () => {
  const [turn, setTurn] = useState(0);
  const [move, setMove] = useState(0);
  const [activeColor, setActiveColor] = useState("black");
  const [activeCoord, setActiveCoord] = useState(null);
  const [boardMatrix, setBoardMatrix] = useState(board.getBoardMatrix());
  const [availableColumns, setAvailableColumns] = useState([]);

  useEffect(() => {
    board.init();
    setBoardMatrix(board.getBoardMatrix());
  }, []);

  useEffect(() => {
    if (!activeCoord) {
      setAvailableColumns([]);
    } else {
      const activeItem = board.getItem(activeCoord);
      if (!activeItem) return;

      const columns = board.getAvailableColumns(
        activeCoord,
        activeItem.movement
      );
      setAvailableColumns(columns);
    }
  }, [activeCoord]);

  const autoPlay = () => {
    board.autoPlay(activeColor, {
      onSelect: selectItem,
      onMove: (itemCoord, coord) => {
        setTimeout(() => moveItem(itemCoord, coord), 250);
      },
    });
  };

  const selectItem = (coord) => {
    const activeItem = board.getItem(coord);

    const successMoves = Object.keys(board.analyzeAvailableAttack(activeColor));

    if (successMoves.length && !successMoves.includes(coord)) {
      selectItem(successMoves[0]);
      return;
    }

    if (activeItem?.color !== activeColor) return;

    board.deselectAllItems();
    board.selectItem(coord);

    setActiveCoord(coord);
    getVoice("select").play();
  };

  const handleSelectItem = ({ target }) => {
    const { coord } = target.dataset;
    selectItem(coord);
  };

  const moveItem = (fromCoord, toCoord) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [toRowId] = useCoord(toCoord);

    if (toRowId === 0 || toRowId === 7) {
      const activeItem = board.getItem(fromCoord);
      activeItem.setKing();
    }

    const coordsOfDestoryItems = board.getItemsBetweenTwoCoords(
      fromCoord,
      toCoord
    );

    const destroyedAnyItemsThisTurn = coordsOfDestoryItems.length > 0;

    board.moveItem(fromCoord, toCoord);

    if (destroyedAnyItemsThisTurn) {
      coordsOfDestoryItems.forEach((coord) => {
        getVoice("destroy").play();
        board.removeItem(coord);
      });
    }

    board.deselectAllItems();
    setBoardMatrix(board.getBoardMatrix());
    setActiveCoord(toCoord);

    const successMoves = Object.keys(board.analyzeAvailableAttack(activeColor));

    if (
      !destroyedAnyItemsThisTurn ||
      (destroyedAnyItemsThisTurn && !successMoves.length)
    ) {
      setActiveColor(activeColor === "white" ? "black" : "white");
      setActiveCoord(null);
      setTurn(turn + 1);
      getVoice("move").play();
    } else {
      board.selectItem(toCoord);
      board.getAvailableColumns(toCoord, board.getItem(toCoord).movement);
    }
    setMove(move + 1);
  };

  const handleMoveItem = ({ target }) => {
    const { coord, available } = target.dataset;

    if (!toBoolean(available)) return;

    moveItem(activeCoord, coord);
  };

  useEffect(() => {
    if (activeColor === "white") autoPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [move]);

  return (
    <>
      <div className={style.board}>
        {boardMatrix.map((row) => (
          <div key={row} class={style.row}>
            {row.map(({ coord, item }) => (
              <div
                key={coord}
                className={style.column}
                data-coord={coord}
                data-available={availableColumns.includes(coord)}
                onClick={handleMoveItem}
              >
                {item && (
                  <div
                    className={`${style.item} ${
                      item.color === "black" ? style.black : style.white
                    }`}
                    onClick={handleSelectItem}
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
      <a
        className={style.boardFooter}
        href="https://github.com/aykutkardas/turkish-checkers"
      >
        GitHub
      </a>
    </>
  );
};

export default App;