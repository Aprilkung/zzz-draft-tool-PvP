import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

class Lab1_670356 {

    public static void main(String[] args) {
        All_Step();
    }

    static List<int[]> sortBeams(List<int[]> data) {
        List<int[]> out = new ArrayList<>();
        for (var pair : data) {
            if (pair[1] < pair[0]) {
                out.add(new int[] { pair[0], pair[1] + 360 });
            } else {
                out.add(new int[] { pair[0], pair[1] });
            }
        }
        out.sort(Comparator.comparingInt(a -> a[0]));  
        return out;
    }

    static List<int[]> mergeBeams(List<int[]> in) {
        if (in.isEmpty()) return in;

        List<int[]> merged = new ArrayList<>();
        int[] cur = in.get(0).clone();       

        for (int i = 1; i < in.size(); i++) {
            int[] nxt = in.get(i);

            if (nxt[0] <= cur[1]) {            
                cur[1] = Math.max(cur[1], nxt[1]); 
            } else {                                   
                merged.add(cur);
                cur = nxt.clone();
            }
        }
        merged.add(cur);                              
        return merged;
    }

    static List<int[]> convertBeams(List<int[]> in) {
        List<int[]> out = new ArrayList<>();
        for (int[] pair : in) {
            int start = pair[0];
            int end   = pair[1] % 360;
            out.add(new int[] { start, end });
        }
        return out;
    }

    static void All_Step() {
        List<int[]> beams = new ArrayList<>(Arrays.asList(
            new int[] { 70, 100 },
            new int[] { 150, 180 },
            new int[] { 160, 185 },
            new int[] { 350, 60 }
        ));

        List<int[]> step12 = sortBeams(beams);
        System.out.println("Step 1-2");
        for (int[] seg : step12) { 
            System.out.println(Arrays.toString(seg));
        }
        System.out.println();

        List<int[]> step3 = mergeBeams(step12);
        System.out.println("Step 3");
        for (int[] seg : step3) {                        
            System.out.println(Arrays.toString(seg));
        }
        System.out.println();

        List<int[]> step4 = convertBeams(step3);
        System.out.println("Step 4");
        for (int[] seg : step4) {           
            System.out.println(Arrays.toString(seg));
        }
    }
}
