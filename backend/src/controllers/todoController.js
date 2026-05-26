import Todo from "../models/Todo.js";

const labelOptions = [
  { name: "Work", color: "blue" },
  { name: "Personal", color: "green" },
  { name: "Urgent", color: "rose" },
  { name: "Do Later", color: "amber" }
];

function normalizeLabelName(labelName) {
  const normalized = String(labelName || "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ");

  return (
    labelOptions.find((label) => label.name.toLowerCase() === normalized) ||
    labelOptions[0]
  );
}

export async function getTodos(req, res, next) {
  try {
    const todos = await Todo.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    next(error);
  }
}

export async function createTodo(req, res, next) {
  try {
    const { title, description = "", labelName = "Work" } = req.body;
    const selectedLabel = normalizeLabelName(labelName);

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Todo title is required" });
    }

    const todo = await Todo.create({
      title: title.trim(),
      description: description.trim(),
      labelColor: selectedLabel.color,
      labelName: selectedLabel.name,
      user: req.user._id
    });

    res.status(201).json(todo);
  } catch (error) {
    next(error);
  }
}

export async function updateTodo(req, res, next) {
  try {
    const { title, description, labelName, completed } = req.body;
    const updates = {};

    if (typeof title === "string") {
      if (!title.trim()) {
        return res.status(400).json({ message: "Todo title cannot be empty" });
      }
      updates.title = title.trim();
    }

    if (typeof description === "string") {
      updates.description = description.trim();
    }

    if (typeof labelName === "string") {
      const selectedLabel = normalizeLabelName(labelName);
      updates.labelName = selectedLabel.name;
      updates.labelColor = selectedLabel.color;
    }

    if (typeof completed === "boolean") {
      updates.completed = completed;
    }

    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json(todo);
  } catch (error) {
    next(error);
  }
}

export async function deleteTodo(req, res, next) {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json({ message: "Todo deleted" });
  } catch (error) {
    next(error);
  }
}
