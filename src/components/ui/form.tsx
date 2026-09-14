"use client";

import * as React from "react";
import { useFormContext, type FieldValues } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

function Form<T extends FieldValues = FieldValues>({
  ...props
}: React.ComponentProps<"form"> & {
  resolver?: ReturnType<typeof zodResolver<z.ZodTypeAny>>;
}) {
  const form = useForm<T>({
    ...(props.resolver ? { resolver: props.resolver } : {}),
    mode: "onBlur",
  });

  return (
    <FormProvider {...form}>
      <form {...props} onSubmit={(e) => void props.onSubmit?.(e)} />
    </FormProvider>
  );
}

function useFormField() {
  const form = useFormContext();
  return { form };
}

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-item"
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="form-label"
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  );
}

function FormControl({ ...props }: React.ComponentProps<"div">) {
  return <div data-slot="form-control" {...props} />;
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="form-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="form-message"
      className={cn("text-destructive text-sm", className)}
      {...props}
    />
  );
}

export { Form, useFormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage };
