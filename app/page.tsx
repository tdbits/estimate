'use client';
import { AccessTime, Edit, EditOff, Restore } from "@mui/icons-material";
import { AppBar, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid2, IconButton, LinearProgress, Menu, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Toolbar, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useEffect, useState } from "react";
import { convertMinutes, convertToDuration, convertToMinutes, durationToString } from "./utils";

type Item = {
  name: string,
  points: number,
  minutes?: number,
  modifiedMinutes?: number
}

type ItemGroup = {
  title: string,
  items: Item[]
}

function isItemGroup(obj: any): obj is ItemGroup {
  return "title" in obj && "items" in obj;
}

function updateMinuteValues<T extends Item | ItemGroup>(item: T, minuteValue: number): T {
  if (isItemGroup(item)) {
    return {
      ...item,
      items: item.items.map(item => updateMinuteValues(item, minuteValue))
    }
  } else {
    return {
      ...item,
      minutes: item.points * minuteValue
    }
  }
}

function calculateStoryPoints<T extends Item | ItemGroup>(item: T): number {
  if (isItemGroup(item)) {
    return item.items.reduce((prev, cur) => prev + calculateStoryPoints(cur), 0);
  } else {
    return item.points;
  }
}

function calculateMinutes<T extends Item | ItemGroup>(item: T): number {
  if (isItemGroup(item)) {
    return item.items.reduce((prev, cur) => prev + calculateMinutes(cur), 0);
  } else if (item.modifiedMinutes !== undefined) {
    return item.modifiedMinutes;
  } else if (item.minutes !== undefined) {
    return item.minutes;
  } else {
    return 0;
  }
}

function updateItem(items: Array<Item | ItemGroup>, itemIdx: number, item: Item | ItemGroup) {
  return [
    ...items.slice(0, itemIdx),
    item,
    ...items.slice(itemIdx + 1)
  ];
}

function deleteItem(items: Array<Item | ItemGroup>, itemIdx: number) {
  const updatedItems = [...items];
  updatedItems.splice(itemIdx, 1);
  return updatedItems;
}

export default function Home() {
  const [items, setItems] = useState<Array<Item | ItemGroup>>([]);
  const [editModeEnabled, setEditModeEnabled] = useState<boolean>(true);
  const [minuteValue, setMinuteValue] = useState<number>();
  const [minuteValueDialogOpen, setMinuteValueDialogOpen] = useState<boolean>(false);

  const handleDialogOpen = () => {
    setMinuteValueDialogOpen(true);
  }

  const handleDialogClose = () => {
    setMinuteValueDialogOpen(false);
  }

  useEffect(() => {
    if (minuteValue !== undefined && minuteValue > 0) {
      setItems(items.map(item => updateMinuteValues(item, minuteValue)));
    }
  }, [minuteValue])

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Typography sx={{ flexGrow: 1 }}>Estimate!</Typography>
          <IconButton
            color="inherit"
            onClick={() => setEditModeEnabled(!editModeEnabled)}>
            {editModeEnabled &&
              <EditOff />
            }
            {!editModeEnabled &&
              <Edit />
            }
          </IconButton>
          <IconButton
            color="inherit"
            onClick={handleDialogOpen}
          >
            <AccessTime />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Grid container spacing={1} sx={{ paddingTop: "5em" }}>
        {editModeEnabled &&
          <Grid size={12}>
            <AddElementTextField
              label="Group title"
              onSubmit={name => setItems([
                ...items,
                {
                  title: name,
                  items: []
                }
              ])}
            />
          </Grid>
        }
        <Grid size={12}>
          {items.map((item, idx) => {
            if (isItemGroup(item)) {
              return (
                <ItemGroupElement
                  group={item}
                  groupIdx={idx}
                  editModeEnabled={editModeEnabled}
                  addItem={item => setItems([
                    ...items,
                    item
                  ])}
                  onUpdate={(itemIdx, item) => {
                    const updatedItems = updateItem(items, itemIdx, item);
                    setItems(updatedItems);
                  }}
                  onDelete={(itemIdx) => {
                    const updatedItems = deleteItem(items, itemIdx);
                    setItems(updatedItems);
                  }}
                />
              )
            } else {
              return (
                <UserStoryElement
                  key={idx}
                  item={item}
                  itemIdx={idx}
                  onUpdate={(itemIdx, item) => {
                    const updatedItems = updateItem(items, itemIdx, item);
                    setItems(updatedItems);
                  }}
                  onDelete={(itemIdx) => {
                    const updatedItems = deleteItem(items, itemIdx);
                    setItems(updatedItems);
                  }}
                />
              )
            }
          })}
        </Grid>
      </Grid>
      <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0 }}>
        <Toolbar>
          <Grid2 container spacing={2}>
            <Grid2>
              <Typography component="span">Story Points: {items.reduce((prevValue, curValue) => prevValue + calculateStoryPoints(curValue), 0)}</Typography>
            </Grid2>
            <Grid2>
              {minuteValue !== undefined &&
                <Typography component="span">Gesamtzeit: {
                  <EstimatedTime
                    minutes={items.reduce((prevValue, curValue) => prevValue + calculateMinutes(curValue), 0)}
                    editable={false}
                  />
                }</Typography>
              }
            </Grid2>
          </Grid2>
        </Toolbar>
      </AppBar>

      <Dialog
        open={minuteValueDialogOpen}
        onClose={handleDialogClose}
        PaperProps={{
          component: "form",
          onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries((formData as any).entries());
            const minuteValue = formJson.minuteValue;
            handleDialogClose();
            setMinuteValue(minuteValue);
          },
        }}
      >
        <DialogTitle>Time Value</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Time value in minutes for 1 story point.
          </DialogContentText>
          <TextField
            required
            autoFocus
            name="minuteValue"
            fullWidth
            variant="standard"
          />
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button type="submit">Set value</Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </>
  );
}

type onSubmitCallback = (name: string) => void;
type addItemCallback = (item: Item) => void;
type onUpdateCallback = (itemIdx: number, item: Item | ItemGroup) => void;
type onDeleteCallback = (itemIdx: number) => void;

function AddElementTextField({ label, onSubmit }: { label: string, onSubmit: onSubmitCallback }) {
  const [textFieldValue, setTextFieldValue] = useState<string>("");

  return (
    <TextField
      variant="outlined"
      size="small"
      fullWidth={true}
      label={label}
      value={textFieldValue}
      onChange={event => { setTextFieldValue(event.target.value) }}
      onKeyDown={event => {
        if (event.key === "Enter") {
          onSubmit(textFieldValue);
          setTextFieldValue("");
        }
      }
      } />
  );
}

function ItemGroupElement({ group, groupIdx, editModeEnabled, onUpdate, onDelete }: { group: ItemGroup, groupIdx: number, editModeEnabled: boolean, addItem: addItemCallback, onUpdate: onUpdateCallback, onDelete: onDeleteCallback }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="column" spacing={1}>
          <Stack direction="row" spacing={1}>
            <Typography sx={{ fontWeight: "bold" }}>{group.title}</Typography>
            <Chip label={group.items.reduce((prev, cur) => prev + calculateStoryPoints(cur), 0)} color="primary" variant="outlined" size="small" />
            <EstimatedTime
              minutes={group.items.reduce((prev, cur) => prev + calculateMinutes(cur), 0)}
              editable={false}
            />
          </Stack>
          {editModeEnabled &&
            <AddElementTextField
              label="User Story"
              onSubmit={name => onUpdate(groupIdx, {
                ...group,
                items: [
                  ...group.items,
                  {
                    name: name,
                    points: 0
                  }
                ]
              })}
            />
          }
          {group.items.map((item, idx) => (
            <UserStoryElement
              key={idx}
              item={item}
              itemIdx={idx}
              onUpdate={(itemIdx, item) => {
                const updatedItems = updateItem(group.items, itemIdx, item) as Item[];
                onUpdate(groupIdx, {
                  ...group,
                  items: updatedItems
                });
              }}
              onDelete={itemIdx => {
                const updatedItems = deleteItem(group.items, groupIdx);
                deleteItem(updatedItems, itemIdx);
              }}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

function UserStoryElement({ item, itemIdx, onUpdate, onDelete }: { item: Item, itemIdx: number, onUpdate: onUpdateCallback, onDelete: onDeleteCallback }) {
  const [storyItem, setStoryItem] = useState<Item | undefined>();
  const [contextMenu, setContextMenu] = useState<{
    type: 'name' | 'points';
    itemIdx: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [textFieldValue, setTextFieldValue] = useState<string>("");

  useEffect(() => {
    setStoryItem(item);
  }, [item])

  const handleContextMenu = (event: React.MouseEvent, itemIdx: number, type: 'name' | 'points') => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
          type: type,
          itemIdx: itemIdx,
          mouseX: event.clientX + 2,
          mouseY: event.clientY - 6,
        }
        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
        // Other native context menus might behave different.
        // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
        null,
    );
  };
  const handleClose = () => {
    setContextMenu(null);
  };

  return (
    <Grid container spacing={1}>
      <Grid size={4} onContextMenu={event => handleContextMenu(event, itemIdx, 'name')}>
        {!editMode && storyItem !== undefined &&
          <Typography>{storyItem.name}</Typography>
        }
        {editMode &&
          <TextField
            variant="outlined"
            fullWidth={true}
            size="small"
            value={textFieldValue}
            onChange={event => { setTextFieldValue(event.target.value) }}
            onKeyDown={event => {
              if (event.key === "Enter") {
                onUpdate(
                  itemIdx,
                  {
                    name: textFieldValue,
                    points: item.points
                  }
                );
                setTextFieldValue("");
                setEditMode(false);
              }
            }}
          />
        }
      </Grid>
      <Grid size={7} onContextMenu={event => handleContextMenu(event, itemIdx, 'points')}>
        <LinearProgress
          variant="determinate"
          value={item.points > 0 ? (item.points / 40) * 100 : 0}
          sx={{ height: "100%" }}
        />
      </Grid>
      <Grid size={1} onContextMenu={event => handleContextMenu(event, itemIdx, 'points')}>
        <Stack direction="row" spacing={1}>
          <Chip label={item.points} color="primary" variant="outlined" />
          {item.minutes !== undefined &&
            <EstimatedTime
              editable={true}
              minutes={item.minutes}
              modifiedMinutes={item.modifiedMinutes}
              onMinuteChange={minutes => onUpdate(itemIdx, { ...item, modifiedMinutes: minutes })}
            />
          }
        </Stack>
      </Grid>
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {contextMenu !== null && contextMenu.type === 'name' &&
          <>
            <MenuItem onClick={() => {
              setTextFieldValue(storyItem!.name);
              setEditMode(true);
              handleClose();
            }}>Bearbeiten</MenuItem>
            <MenuItem onClick={() => onDelete(itemIdx)}>Löschen</MenuItem>
          </>
        }
        {contextMenu !== null && contextMenu.type === 'points' &&
          <>
            {[1, 2, 3, 5, 8, 13, 20, 40].map(point => (
              <Button
                key={`button-${point}`}
                size="small"
                onClick={() => {
                  onUpdate(
                    itemIdx,
                    {
                      name: item.name,
                      points: point
                    }
                  );
                  handleClose();
                }}
              >
                {point}
              </Button>
            ))}
          </>
        }
      </Menu>
    </Grid>
  )
}

function EstimatedTime({ minutes, modifiedMinutes, editable, onMinuteChange = () => { } }: { minutes: number, modifiedMinutes?: number, editable: boolean, onMinuteChange?: (minutes?: number) => void }) {
  const [editMode, setEditMode] = useState<boolean>(false);
  const [textFieldValue, setTextFieldValue] = useState<string>("");
  let duration = modifiedMinutes !== undefined ? convertMinutes(modifiedMinutes) : convertMinutes(minutes);

  useEffect(() => {
    if (modifiedMinutes !== undefined) {
      setTextFieldValue(durationToString(convertMinutes(modifiedMinutes)));
    } else {
      setTextFieldValue(durationToString(convertMinutes(minutes)));
    }
  }, [minutes, modifiedMinutes]);

  if (editMode) {
    return (
      <TextField
        variant="outlined"
        fullWidth={true}
        size="small"
        value={textFieldValue}
        onChange={event => { setTextFieldValue(event.target.value) }}
        onKeyDown={event => {
          if (event.key === "Enter") {
            onMinuteChange(convertToMinutes(convertToDuration(textFieldValue)));
            setTextFieldValue("");
            setEditMode(false);
          }
        }}
      />
    )
  } else if (modifiedMinutes !== undefined) {
    return (
      <Stack direction="row" spacing={2}>
        <Typography
          component="span"
          color="primary"
        >
          {durationToString(duration)}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onMinuteChange()}
        >
          <Restore />
        </IconButton>
      </Stack>
    )
  } else {
    return (
      <Typography
        component="span"
        onClick={() => {
          if (editable) {
            setEditMode(true);
          }
        }}
      >
        {durationToString(duration)}
      </Typography>
    )
  }
}