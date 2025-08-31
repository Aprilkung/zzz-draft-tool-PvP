package Lab2_0356;

public class Main {
    public static void main(String[] args) {

        System.out.println("Testing Algorithm");
        testIsPrime012();
        System.out.println("-------------------------");
        
        System.out.println("Testing 100k - 1M");
        System.out.println("This is is prime0");
        bench_isPrime(new IsPrime0  ());
        System.out.println("-------------------------");
        System.out.println("This is is prime1");
        bench_isPrime(new isPrime1  ());
        System.out.println("-------------------------");
        System.out.println("This is is prime2");
        bench_isPrime(new IsPrime2  ());

    }

    private static void testIsPrime012() {
        int N = 100;
        int count = 0;

        L2_IsPrimeInterface obj = new IsPrime0();
        for (int n = 1; n < N; n++) {
            if (obj.isPrime(n))
                count++;
        }
        System.out.println("Pi0 (" + N + ")= " + count);

        count = 0;
        obj = new isPrime1();
        // bench_isPrime(obj);
        for (int n = 1; n < N; n++) {
            if (obj.isPrime(n))
                count++;
        }
        System.out.println("Pi1 (" + N + ")= " + count);

        count = 0;
        obj = new IsPrime2();
        for (int n = 1; n < N; n++) {
            if (obj.isPrime(n))
                count++;
        }
        System.out.println("Pi2 (" + N + ")= " + count);
    }

    public static void bench_isPrime(L2_IsPrimeInterface obj) {
        int your_cpu_factor = 1; /* increase by 10 times */
        int N = 100;
        int count = 0;
        // long start = 0;
        for (N = 100_000; N <= 1_000_000 * your_cpu_factor; N += 100_000 * your_cpu_factor) {
            count = 0;
            long start = System.currentTimeMillis();
            for (int n = 1; n < N; n++) {
                if (obj.isPrime(n))
                    count++;
            }
            long time = (System.currentTimeMillis() - start);
            System.out.println(N + "\t" + count + "\t" + time);
        }
    }
}