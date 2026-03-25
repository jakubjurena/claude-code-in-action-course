"use client";

import {
  FilePlus,
  Pencil,
  Eye,
  Trash2,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";

interface ToolInvocationCardProps {
  toolInvocation: {
    toolCallId: string;
    toolName: string;
    input: Record<string, any>;
    state: string;
    output?: unknown;
    errorText?: string;
  };
}

function basename(path: string): string {
  return path.split("/").filter(Boolean).at(-1) ?? path;
}

export function getOperationLabel(toolName: string, command?: string): string {
  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":     return "Created";
      case "str_replace": return "Edited";
      case "insert":     return "Edited";
      case "view":       return "Viewed";
      case "undo_edit":  return "Undone edit in";
      default:           return `Used ${toolName} on`;
    }
  }
  if (toolName === "file_manager") {
    switch (command) {
      case "rename": return "Renamed";
      case "delete": return "Deleted";
      default:       return `Used ${toolName} on`;
    }
  }
  return `Used ${toolName} on`;
}

export function getDisplayFilename(toolName: string, args: Record<string, any>): string {
  if (toolName === "file_manager" && args.command === "rename" && args.new_path) {
    return `${basename(args.path)} → ${basename(args.new_path)}`;
  }
  return basename(args.path ?? "");
}

function getOperationIcon(toolName: string, command?: string): LucideIcon {
  if (toolName === "file_manager") {
    if (command === "delete") return Trash2;
    if (command === "rename") return ArrowRight;
  }
  if (command === "create") return FilePlus;
  if (command === "view")   return Eye;
  return Pencil;
}

function isPending(state: string): boolean {
  return state !== "output-available" && state !== "output-error";
}

function isError(state: string): boolean {
  return state === "output-error";
}

export function ToolInvocationCard({ toolInvocation }: ToolInvocationCardProps) {
  const { toolName, input, state } = toolInvocation;
  const command: string | undefined = input?.command;

  const label = getOperationLabel(toolName, command);
  const filename = getDisplayFilename(toolName, input ?? {});
  const OperationIcon = getOperationIcon(toolName, command);
  const pending = isPending(state);
  const error = isError(state);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg border border-neutral-200">
      <OperationIcon className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
      <span className="text-xs text-neutral-700">
        {label} <strong className="font-medium">{filename}</strong>
      </span>
      {pending && (
        <span data-testid="status-pending" className="ml-auto">
          <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
        </span>
      )}
      {!pending && !error && (
        <span data-testid="status-success" className="ml-auto">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        </span>
      )}
      {!pending && error && (
        <span data-testid="status-error" className="ml-auto">
          <XCircle className="w-3 h-3 text-red-500" />
        </span>
      )}
    </div>
  );
}
