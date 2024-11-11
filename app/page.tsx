'use client';
import { AccessTime, Delete, Edit, EditOff, Restore } from "@mui/icons-material";
import { AppBar, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid2, IconButton, LinearProgress, Menu, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Toolbar, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useEffect, useState } from "react";
import { calculateMinutes, calculateStoryPoints, convertMinutes, convertToDuration, convertToMinutes, durationToString } from "./utils";
import { Group, isItemGroup, UserStory } from "./types";


function updateMinuteValues<T extends UserStory | Group>(item: T, minuteValue: number): T {
  if (isItemGroup(item)) {
    return {
      ...item,
      stories: item.stories.map(item => updateMinuteValues(item, minuteValue))
    }
  } else {
    return {
      ...item,
      minutes: item.points * minuteValue
    }
  }
}

type AddGroupCallback = (group: Group) => void;
type UpdateGroupCallback = (groupIdx: number, group: Group) => void;
type DeleteGroupCallback = (groupIdx: number) => void;
type AddUserStoryCallback = (groupIdx: number, userStory: UserStory) => void;
type UpdateUserStoryCallback = (groupIdx: number, storyIdx: number, userStory: UserStory) => void;
type DeleteUserStoryCallback = (groupIdx: number, storyIdx: number) => void;

export default function Home() {
  const [groups, setGroups] = useState<Array<Group>>([]);
  const [editModeEnabled, setEditModeEnabled] = useState<boolean>(true);
  const [minuteValue, setMinuteValue] = useState<number>();
  const [minuteValueDialogOpen, setMinuteValueDialogOpen] = useState<boolean>(false);

  const handleDialogOpen = () => {
    setMinuteValueDialogOpen(true);
  }

  const handleDialogClose = () => {
    setMinuteValueDialogOpen(false);
  }

  const handleAddGroup = ((itemGroup: Group) => {
    setGroups([
      ...groups,
      itemGroup
    ]);
  });

  const handleUpdateGroup = (groupIdx: number, group: Group) => {
    const updatedItems = [...groups];
    updatedItems[groupIdx] = group;
    setGroups(updatedItems);
  }

  const handleDeleteGroup = (groupIdx: number) => {
    const updatedGroups = [...groups];
    updatedGroups.splice(groupIdx, 1);
    setGroups(updatedGroups);
  }

  const handleAddUserStory = (groupIdx: number, userStory: UserStory) => {
    const group = groups[groupIdx];
    const updatedGroup: Group = {
      ...group,
      stories: [
        ...group.stories,
        {
          ...userStory,
          minutes: minuteValue !== undefined ? userStory.points * minuteValue : userStory.minutes
        } as UserStory
      ]
    }
    handleUpdateGroup(groupIdx, updatedGroup);
  }

  const handleUpdateUserStory = (groupIdx: number, storyIdx: number, userStory: UserStory) => {
    const group = groups[groupIdx];
    const updatedStory: UserStory = {
      ...userStory,
      minutes: minuteValue !== undefined ? userStory.points * minuteValue : userStory.minutes
    }
    group.stories[storyIdx] = updatedStory;
    handleUpdateGroup(groupIdx, group);
  }

  const handleDeleteUserStory = (groupIdx: number, storyIdx: number) => {
    const group = groups[groupIdx];
    group.stories.splice(groupIdx, 1);
    handleUpdateGroup(groupIdx, group);
  }

  const onUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    return true;
  }

  useEffect(() => {
    if (groups.length > 0) {
      window.addEventListener('beforeunload', onUnload);
    } else {
      window.removeEventListener('beforeunload', onUnload);
    }
  }, [groups]);

  useEffect(() => {
    if (minuteValue !== undefined && minuteValue > 0) {
      setGroups(groups.map(item => updateMinuteValues(item, minuteValue)));
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
      <Grid container spacing={1} sx={{ paddingTop: "5em", paddingBottom: "5em" }}>
        {editModeEnabled &&
          <Grid size={12}>
            <AddElementTextField
              label="Group title"
              onSubmit={title => handleAddGroup({
                title: title,
                stories: []
              })}
            />
          </Grid>
        }
        <Grid size={12}>
          {groups.map((group, idx) => {
            return (
              <GroupElement
                group={group}
                groupIdx={idx}
                editModeEnabled={editModeEnabled}
                onAddUserStory={handleAddUserStory}
                onUpdateUserStory={handleUpdateUserStory}
                onDeleteUserStory={handleDeleteUserStory}
              />
            )
          })}
        </Grid>
      </Grid>
      <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0 }}>
        <Toolbar>
          <Grid2 container spacing={2}>
            <Grid2>
              <Typography component="span">Story Points: {groups.reduce((prevValue, curValue) => prevValue + calculateStoryPoints(curValue), 0)}</Typography>
            </Grid2>
            <Grid2>
              {minuteValue !== undefined &&
                <Typography component="span">Gesamtzeit: {
                  <EstimatedTime
                    minutes={groups.reduce((prevValue, curValue) => prevValue + calculateMinutes(curValue), 0)}
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

function AddElementTextField({ label, onSubmit }: { label: string, onSubmit: (name: string) => void }) {
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

function GroupElement({ group, groupIdx, editModeEnabled, onAddUserStory, onUpdateUserStory, onDeleteUserStory }: { group: Group, groupIdx: number, editModeEnabled: boolean, onAddUserStory: AddUserStoryCallback, onUpdateUserStory: UpdateUserStoryCallback, onDeleteUserStory: DeleteUserStoryCallback }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="column" spacing={1}>
          <Stack direction="row" spacing={1}>
            <Typography sx={{ fontWeight: "bold" }}>{group.title}</Typography>
            <Chip label={group.stories.reduce((prev, cur) => prev + calculateStoryPoints(cur), 0)} color="primary" variant="outlined" size="small" />
            <EstimatedTime
              minutes={group.stories.reduce((prev, cur) => prev + calculateMinutes(cur), 0)}
              editable={false}
            />
          </Stack>
          {editModeEnabled &&
            <AddElementTextField
              label="User Story"
              onSubmit={name => onAddUserStory(groupIdx, {
                name: name,
                points: 0
              })}
            />
          }
          {group.stories.map((item, idx) => (
            <UserStoryElement
              key={idx}
              item={item}
              groupIdx={groupIdx}
              itemIdx={idx}
              onUpdate={onUpdateUserStory}
              onDelete={onDeleteUserStory}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

function UserStoryElement({ item, groupIdx, itemIdx, onUpdate, onDelete }: { item: UserStory, groupIdx: number, itemIdx: number, onUpdate: UpdateUserStoryCallback, onDelete: DeleteUserStoryCallback }) {
  const [storyItem, setStoryItem] = useState<UserStory | undefined>();
  const [contextMenu, setContextMenu] = useState<{
    type: 'name' | 'points';
    groupIdx: number;
    itemIdx: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [textFieldValue, setTextFieldValue] = useState<string>("");

  useEffect(() => {
    setStoryItem(item);
  }, [item])

  const handleContextMenu = (event: React.MouseEvent, groupIdx: number, itemIdx: number, type: 'name' | 'points') => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
          type: type,
          groupIdx: groupIdx,
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
      <Grid size={4} onContextMenu={event => handleContextMenu(event, groupIdx, itemIdx, 'name')}>
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
                  groupIdx,
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
      <Grid size={7} onContextMenu={event => handleContextMenu(event, groupIdx, itemIdx, 'points')}>
        <LinearProgress
          variant="determinate"
          value={item.points > 0 ? (item.points / 40) * 100 : 0}
          sx={{ height: "100%" }}
        />
      </Grid>
      <Grid size={1}>
        <Stack direction="row" spacing={1}>
          <Chip label={item.points} color="primary" variant="outlined" />
          {item.minutes !== undefined &&
            <EstimatedTime
              editable={true}
              minutes={item.minutes}
              modifiedMinutes={item.modifiedMinutes}
              onMinuteChange={minutes => onUpdate(groupIdx, itemIdx, { ...item, modifiedMinutes: minutes })}
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
            <MenuItem onClick={() => onDelete(groupIdx, itemIdx)}>Löschen</MenuItem>
          </>
        }
        {contextMenu !== null && contextMenu.type === 'points' &&
          <>
            {storyItem?.points !== 0 &&
              <Button
                size="small"
                onClick={() => {
                  onUpdate(
                    groupIdx,
                    itemIdx,
                    {
                      name: item.name,
                      points: 0
                    }
                  );
                  handleClose();
                }}
              >
                <Delete sx={{ fontSize: "1.25em"}} />
              </Button>
            }
            {[1, 2, 3, 5, 8, 13, 20, 40].map(point => (
              <Button
                key={`button-${point}`}
                size="small"
                disabled={storyItem?.points === point}
                onClick={() => {
                  onUpdate(
                    groupIdx,
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
        <Button
          variant="outlined"
          color="primary"
        >
          {durationToString(duration)}
        </Button>
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
      <Button
          variant="outlined"
          color="primary"
        onClick={() => {
          if (editable) {
            setEditMode(true);
          }
        }}
      >
        {durationToString(duration)}
      </Button>
    )
  }
}