public class Linear_HW {
    public class MatrixOperations {
        
    public static void main(String[] args) {
        double[][] matrix = {
            {1, 2, 3},
            {0, 1, 4},
            {5, 6, 0}
        };

        System.out.println("Original Matrix:");
        printMatrix(matrix);

        double determinant = calculateDeterminant(matrix);
        System.out.println("\nDeterminant: " + determinant);

        if (determinant != 0) {
            double[][] inverseMatrix = calculateInverse(matrix, determinant);
            System.out.println("\nInverse Matrix:");
            printMatrix(inverseMatrix);
        } else {
            System.out.println("\nInverse does not exist because the determinant is zero.");
        }
    }

    public static double calculateDeterminant(double[][] matrix) {
        if (matrix.length != 3 || matrix[0].length != 3) {
            throw new IllegalArgumentException("Matrix must be 3x3.");
        }

        double det = matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1])
                   - matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0])
                   + matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);
        return det;
    }

    public static double[][] calculateInverse(double[][] matrix, double determinant) {
        if (matrix.length != 3 || matrix[0].length != 3) {
            throw new IllegalArgumentException("Matrix must be 3x3.");
        }
        if (determinant == 0) {
            throw new IllegalArgumentException("Determinant is zero, inverse does not exist.");
        }

        double[][] inverse = new double[3][3];

        double[][] cofactor = new double[3][3];
        cofactor[0][0] = (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]);
        cofactor[0][1] = -(matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]);
        cofactor[0][2] = (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);

        cofactor[1][0] = -(matrix[0][1] * matrix[2][2] - matrix[0][2] * matrix[2][1]);
        cofactor[1][1] = (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0]);
        cofactor[1][2] = -(matrix[0][0] * matrix[2][1] - matrix[0][1] * matrix[2][0]);

        cofactor[2][0] = (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]);
        cofactor[2][1] = -(matrix[0][0] * matrix[1][2] - matrix[0][2] * matrix[1][0]);
        cofactor[2][2] = (matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]);

        double[][] adjoint = new double[3][3];
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                adjoint[i][j] = cofactor[j][i];
            }
        }

        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                inverse[i][j] = adjoint[i][j] / determinant;
            }
        }

        return inverse;
    }

    public static void printMatrix(double[][] matrix) {
        for (double[] row : matrix) {
            for (double element : row) {
                System.out.printf("%.4f\t", element);
            }
            System.out.println();
        }
    }
}
}
