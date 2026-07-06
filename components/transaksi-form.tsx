'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Plus, Loader2, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  jenisKas: z.enum(['biasa', 'koperasi']),
  tipeTransaksi: z.enum(['pemasukan', 'pengeluaran']),
  jumlah: z.number().positive('Jumlah harus lebih dari 0'),
  keterangan: z.string().min(1, 'Keterangan tidak boleh kosong'),
  tanggal: z.date(),
});

type FormValues = z.infer<typeof formSchema>;

export interface TransaksiFormProps {
  kasType?: 'biasa' | 'koperasi';
  onSuccess?: () => void;
}

export default function TransaksiForm({ kasType }: TransaksiFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jenisKas: kasType ?? 'biasa',
      tipeTransaksi: 'pemasukan',
      jumlah: undefined as unknown as number,
      keterangan: '',
      tanggal: new Date(),
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: values.tipeTransaksi,
          kas_type: values.jenisKas,
          amount: values.jumlah,
          description: values.keterangan,
          trans_date: format(values.tanggal, 'yyyy-MM-dd'),
        }),
      });
      if (res.ok) {
        form.reset({
          jenisKas: kasType ?? 'biasa',
          tipeTransaksi: 'pemasukan',
          jumlah: undefined as unknown as number,
          keterangan: '',
          tanggal: new Date(),
        });
        toast.success('Transaksi berhasil ditambahkan!');
        router.refresh();
      } else {
        toast.error('Gagal menambahkan transaksi');
      }
    } catch {
      toast.error('Gagal menambahkan transaksi: Network error');
    } finally {
      setLoading(false);
    }
  }

  const currentTipe = form.watch("tipeTransaksi");
  const currentJenis = form.watch("jenisKas");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="size-5" />
          Tambah Transaksi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Jenis Kas - hidden when kasType is provided */}
            {!kasType && (
              <FormField
                control={form.control}
                name="jenisKas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kas</FormLabel>
                    <FormControl>
                      <ToggleGroup
                        value={[field.value]}
                        onValueChange={(value: string[]) => {
                          if (value.length > 0) field.onChange(value[0]);
                        }}
                        className="w-full"
                      >
                        <ToggleGroupItem
                          value="biasa"
                          className={cn(
                            'flex-1 transition-all aria-pressed:bg-amber-600 data-[state=on]:bg-amber-600',
                            currentJenis === 'biasa'
                              ? '!bg-amber-600 text-white shadow-md ring-2 ring-amber-300'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400'
                          )}
                        >
                          🪙 Kas Biasa
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="koperasi"
                          className={cn(
                            'flex-1 transition-all aria-pressed:bg-blue-600 data-[state=on]:bg-blue-600',
                            currentJenis === 'koperasi'
                              ? '!bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400'
                          )}
                        >
                          🏦 Kas Koperasi
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Tipe Transaksi */}
            <FormField
              control={form.control}
              name="tipeTransaksi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Transaksi</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      value={[field.value]}
                      onValueChange={(value: string[]) => {
                        if (value.length > 0) field.onChange(value[0]);
                      }}
                      className="w-full"
                    >
                      <ToggleGroupItem
                        value="pemasukan"
                        className={cn(
                          'flex-1 transition-all aria-pressed:bg-emerald-600 data-[state=on]:bg-emerald-600',
                          currentTipe === 'pemasukan'
                            ? '!bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400'
                        )}
                      >
                        ↑ Pemasukan
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="pengeluaran"
                        className={cn(
                          'flex-1 transition-all aria-pressed:bg-rose-600 data-[state=on]:bg-rose-600',
                          currentTipe === 'pengeluaran'
                            ? '!bg-rose-600 text-white shadow-md ring-2 ring-rose-300'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400'
                        )}
                      >
                        ↓ Pengeluaran
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Jumlah, Keterangan, Tanggal */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="jumlah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? undefined
                              : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="keterangan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keterangan</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Deskripsi transaksi"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tanggal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal</FormLabel>
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          />
                        }
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {field.value ? (
                          format(field.value, 'dd MMMM yyyy', { locale: id })
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={id}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full h-14 text-base font-semibold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus className="size-5" />
                  Simpan Transaksi
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
